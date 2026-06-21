import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../lib/api';
import { Crown, Check, X, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';

interface TierInfo {
  name: string;
  price: number;
  period: string;
  features: string[];
}

interface SubscriptionData {
  subscription: {
    tier: string;
    status: string;
    trial_end?: string;
    days_left: number;
    is_trial: boolean;
    is_expired: boolean;
  };
  usage: {
    classes: number;
    students: number;
    study_guides: number;
    tasks: number;
  };
  tier_info: TierInfo;
  available_tiers: Record<string, TierInfo>;
}

const TIER_COLORS: Record<string, string> = {
  free: 'border-gray-200 bg-gray-50',
  basic: 'border-teal-200 bg-teal-50',
  pro: 'border-gold-300 bg-gold-50',
};

const TIER_BUTTON_COLORS: Record<string, string> = {
  free: 'bg-gray-600 hover:bg-gray-700',
  basic: 'bg-teal-700 hover:bg-teal-800',
  pro: 'bg-gold-600 hover:bg-gold-700',
};

export default function Subscription() {
  const { user, token, refreshSubscription } = useAuth();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await authFetch('/api/subscription/status');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load subscription');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUpgrade = (tier: string) => {
    setSelectedTier(tier);
    setShowConfirm(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedTier) return;
    setUpgrading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authFetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      });
      const json = await res.json();
      if (res.ok) {
        setSuccess(json.message);
        await refreshSubscription();
        await fetchStatus();
      } else {
        setError(json.error || 'Upgrade failed');
      }
    } catch (e) {
      setError('Network error during upgrade');
    } finally {
      setUpgrading(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will be downgraded to the Free plan.')) return;
    setUpgrading(true);
    try {
      const res = await authFetch('/api/subscription/cancel', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setSuccess(json.message);
        await refreshSubscription();
        await fetchStatus();
      } else {
        setError(json.error || 'Cancel failed');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  if (!data) return null;

  const { subscription, usage, tier_info, available_tiers } = data;
  const currentTier = subscription.tier;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-1">Manage your plan and billing.</p>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

      {/* Current Plan Card */}
      <div className={`bg-white rounded-xl border-2 ${TIER_COLORS[currentTier] || TIER_COLORS.free} p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-teal-800" />
              <h2 className="text-lg font-semibold text-gray-900">Current Plan: {tier_info.name}</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {subscription.is_trial ? (
                <span className="flex items-center gap-1 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  Free trial — {subscription.days_left} days left
                </span>
              ) : subscription.is_expired ? (
                <span className="text-red-600 font-medium">Trial expired — upgrade to continue</span>
              ) : (
                <span className="text-teal-700">Active subscription</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              R{tier_info.price}<span className="text-sm font-normal text-gray-500">/month</span>
            </p>
          </div>
        </div>

        {/* Usage bars */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <UsageBar label="Classes" current={usage.classes} max={getLimit(currentTier, 'classes')} />
          <UsageBar label="Students" current={usage.students} max={getLimit(currentTier, 'students')} />
          <UsageBar label="Study Guides" current={usage.study_guides} max={getLimit(currentTier, 'studyGuides')} />
          <UsageBar label="Tasks" current={usage.tasks} max={getLimit(currentTier, 'tasks')} />
        </div>

        {currentTier !== 'free' && (
          <button
            onClick={handleCancel}
            disabled={upgrading}
            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Cancel subscription
          </button>
        )}
      </div>

      {/* Tier Selection */}
      <h3 className="text-lg font-semibold text-gray-900">Choose a Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(available_tiers).map(([tierKey, tier]) => (
          <div
            key={tierKey}
            className={`bg-white rounded-xl border-2 p-6 ${
              currentTier === tierKey ? 'border-teal-600 ring-2 ring-teal-100' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">{tier.name}</h4>
              {currentTier === tierKey && (
                <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">Current</span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              R{tier.price}<span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <ul className="mt-4 space-y-2">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(tierKey)}
              disabled={currentTier === tierKey || upgrading}
              className={`mt-6 w-full py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
                TIER_BUTTON_COLORS[tierKey] || TIER_BUTTON_COLORS.free
              }`}
            >
              {currentTier === tierKey ? 'Current Plan' : upgrading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Upgrading...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">Upgrade <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Upgrade">
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to upgrade to the <strong>{available_tiers[selectedTier]?.name}</strong> plan for{' '}
            <strong>R{available_tiers[selectedTier]?.price}/month</strong>.
          </p>
          <p className="text-sm text-gray-500">
            (Note: In a production environment, this would redirect to a secure payment gateway like PayFast or Stripe.)
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmUpgrade}
              disabled={upgrading}
              className="px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors disabled:opacity-50"
            >
              {upgrading ? 'Processing...' : 'Confirm Upgrade'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={isAtLimit ? 'text-red-600 font-medium' : isNearLimit ? 'text-amber-600' : 'text-gray-500'}>
          {current} / {max === 999999 ? 'Unlimited' : max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-teal-600'
          }`}
          style={{ width: `${max === 999999 ? 100 : percentage}%` }}
        />
      </div>
    </div>
  );
}

function getLimit(tier: string, resource: string): number {
  const limits: Record<string, Record<string, number>> = {
    free: { classes: 3, students: 30, studyGuides: 10, tasks: 20 },
    basic: { classes: 999999, students: 100, studyGuides: 30, tasks: 999999 },
    pro: { classes: 999999, students: 999999, studyGuides: 999999, tasks: 999999 },
  };
  return limits[tier]?.[resource] || 0;
}
