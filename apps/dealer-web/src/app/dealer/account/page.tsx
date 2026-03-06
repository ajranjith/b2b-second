"use client";

import { useState } from "react";
import {
  User,
  Building2,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Lock,
} from "lucide-react";

export default function DealerAccountPage() {
  const [accountInfo] = useState({
    dealerName: "Premium Auto Parts Ltd",
    dealerCode: "PAP-2024-001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@premiumauto.co.uk",
    phone: "+44 20 7123 4567",
    address: "123 High Street, London, W1A 1AA",
    joinedDate: "January 2024",
    accountType: "Premium Dealer",
    creditLimit: 50000,
    currentBalance: 12450,
    availableCredit: 37550,
    paymentTerms: "Net 30",
    defaultDispatch: "Standard",
  });
  const [profile, setProfile] = useState({
    firstName: accountInfo.firstName,
    lastName: accountInfo.lastName,
    email: accountInfo.email,
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const creditUsagePercent = (accountInfo.currentBalance / accountInfo.creditLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your dealer account information and preferences
        </p>
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
                      ? "bg-red-500"
                      : creditUsagePercent > 60
                        ? "bg-amber-500"
                        : "bg-green-500"
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
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setProfileSaved(true);
                window.setTimeout(() => setProfileSaved(false), 2000);
              }}
            >
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">First Name</label>
                <input
                  value={profile.firstName}
                  onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Last Name</label>
                <input
                  value={profile.lastName}
                  onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Save Profile
                </button>
                {profileSaved && <span className="text-xs text-green-600">Profile updated.</span>}
              </div>
            </form>

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setPasswords({ current: "", next: "", confirm: "" });
                setPasswordSaved(true);
                window.setTimeout(() => setPasswordSaved(false), 2000);
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Lock className="h-4 w-4 text-slate-400" />
                Change Password
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                  Update Password
                </button>
                {passwordSaved && <span className="text-xs text-green-600">Password updated.</span>}
              </div>
            </form>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">
                    Business Name
                  </div>
                  <div className="text-sm text-slate-900 mt-1">{accountInfo.dealerName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Contact Name</div>
                  <div className="text-sm text-slate-900 mt-1">
                    {profile.firstName} {profile.lastName}
                  </div>
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
                  <div className="text-sm text-slate-900 mt-1">{profile.email}</div>
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

          <div className="mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
            Changes update your profile and password for this dealer account.
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
              <div className="text-xs text-slate-500 mt-1">
                Automatically select this dispatch option at checkout
              </div>
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
              <div className="text-xs text-slate-500 mt-1">
                Receive order updates and announcements
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">SMS Notifications</div>
              <div className="text-xs text-slate-500 mt-1">
                Get urgent order status updates via SMS
              </div>
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
