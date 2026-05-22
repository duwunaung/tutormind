"use client";

import { signOut } from "next-auth/react";

export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-gray-900 border border-gray-800 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative overflow-hidden z-10">
        {/* Warning Indicator */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-3xl mb-4 animate-pulse">
            ⏳
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Subscription Expired</h1>
          <p className="text-gray-400 text-sm max-w-sm">
            Your access to TutorMind has expired. Please complete a payment to extend your subscription and resume generating lesson plans.
          </p>
        </div>

        {/* Payment Details */}
        <div className="space-y-6 mb-8">
          <div className="border-t border-gray-800/80 pt-6">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              💳 Payment Options
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* KBZ Bank */}
              <div className="bg-gray-950/50 border border-gray-800/60 rounded-xl p-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Bank Transfer</div>
                <div className="text-sm font-bold text-white mb-2">KBZ Bank</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Account Name:</span>
                    <span className="text-gray-200 font-medium">TutorMind Academy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span className="text-amber-500 font-semibold font-mono select-all">123-4-56789-0</span>
                  </div>
                </div>
              </div>

              {/* Mobile Wallets */}
              <div className="bg-gray-950/50 border border-gray-800/60 rounded-xl p-4">
                <div className="text-xs text-gray-500 font-medium mb-1">Mobile Money / QR</div>
                <div className="text-sm font-bold text-white mb-2">KBZPay & WaveMoney</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>KBZPay Number:</span>
                    <span className="text-amber-500 font-semibold font-mono select-all">09987654321</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WaveMoney Number:</span>
                    <span className="text-amber-500 font-semibold font-mono select-all">09987654321</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-amber-400 mb-1">How to activate:</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              After transferring, click one of the support channels below and send a screenshot of your payment receipt. Our team will verify and extend your access immediately.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href="https://t.me/tutormind_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl py-2.5 text-sm transition"
          >
            <span>💬 Telegram</span>
          </a>
          <a
            href="viber://chat?number=%2B959987654321"
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl py-2.5 text-sm transition"
          >
            <span>📞 Viber Support</span>
          </a>
        </div>

        {/* Footer Logout */}
        <div className="flex items-center justify-center border-t border-gray-800/80 pt-6">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-500 hover:text-gray-300 font-medium transition flex items-center gap-1.5"
          >
            🚪 Sign out from this account
          </button>
        </div>
      </div>
    </div>
  );
}
