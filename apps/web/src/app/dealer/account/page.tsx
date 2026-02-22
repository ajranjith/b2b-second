'use client';

import { useEffect, useState } from 'react';
import { User, Building2, CreditCard, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

interface AccountInfo {
    dealerName: string;
    dealerCode: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    joinedDate: string;
    accountType: string;
    creditLimit: number;
    currentBalance: number;
    availableCredit: number;
    paymentTerms: string;
    defaultDispatch: string;
}

export default function DealerAccountPage() {
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const user = getUser();
        if (!user || user.role !== 'DEALER') {
            setError('Unauthorized access.');
            setIsLoading(false);
            return;
        }

        api.get('/auth/me')
            .then((res) => {
                const u = res.data.user;
                setAccountInfo({
                    dealerName: u.companyName || u.dealerInfo?.companyName || '-',
                    dealerCode: u.dealerAccountId || '-',
                    contactName: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email,
                    email: u.email || '-',
                    phone: u.phone || '-',
                    address: u.address || '-',
                    joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '-',
                    accountType: u.entitlement || 'Dealer',
                    creditLimit: u.creditLimit ?? 0,
                    currentBalance: u.currentBalance ?? 0,
                    availableCredit: (u.creditLimit ?? 0) - (u.currentBalance ?? 0),
                    paymentTerms: u.paymentTerms || '-',
                    defaultDispatch: u.defaultDispatch || 'Standard',
                });
            })
            .catch(() => setError('Unable to load account information.'))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-40 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !accountInfo) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-16 text-center text-slate-500">
                {error || 'Unable to load account information.'}
            </div>
        );
    }

    const creditUsagePercent = accountInfo.creditLimit > 0
        ? (accountInfo.currentBalance / accountInfo.creditLimit) * 100
        : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-600 mt-1">Manage your dealer account information and preferences</p>
      </div>

      {/* Account Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Credit Status Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Credit Status</h3>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-900">
              £{accountInfo.availableCredit.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Available Credit</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Credit Usage</span>
                <span>{creditUsagePercent.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    creditUsagePercent > 80
                      ? 'bg-red-500'
                      : creditUsagePercent > 60
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>£{accountInfo.currentBalance.toLocaleString()} used</span>
                <span>£{accountInfo.creditLimit.toLocaleString()} limit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Type Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Account Type</h3>
            <Shield className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold text-slate-900">{accountInfo.accountType}</div>
            <p className="text-xs text-slate-500">Since {accountInfo.joinedDate}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Payment Terms</span>
                <span className="font-semibold text-slate-900">{accountInfo.paymentTerms}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Default Dispatch</span>
                <span className="font-semibold text-slate-900">{accountInfo.defaultDispatch}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Code Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Dealer Code</h3>
            <Building2 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold text-slate-900 font-mono">
              {accountInfo.dealerCode}
            </div>
            <p className="text-xs text-slate-500">Use this code for all correspondence</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Contact Information</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Business Name</div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.dealerName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Contact Name</div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.contactName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Member Since</div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.joinedDate}</div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Email</div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Phone</div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.phone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Address</div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Update Contact Details
            </button>
            <button className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Order Preferences</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <div className="text-sm font-semibold text-slate-900">Default Dispatch Method</div>
              <div className="text-xs text-slate-500 mt-1">Automatically select this dispatch option at checkout</div>
            </div>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Standard</option>
              <option>Express</option>
              <option>Collection</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <div className="text-sm font-semibold text-slate-900">Email Notifications</div>
              <div className="text-xs text-slate-500 mt-1">Receive order updates and announcements</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">SMS Notifications</div>
              <div className="text-xs text-slate-500 mt-1">Get urgent order status updates via SMS</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
