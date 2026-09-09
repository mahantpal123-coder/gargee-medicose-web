import React, { useState, useEffect } from 'react';
import { sendTwoFactorOtp, verifyTwoFactorOtp, validateIndianPhone } from '../utils/twoFactorOtp';
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react';

export default function TwoFactorOtpLogin({ onSuccess, onCancel, compact = false }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input_phone'); // 'input_phone' | 'input_otp' | 'verified'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const validation = validateIndianPhone(phone);
    if (!validation.isValid) {
      setErrorMsg(validation.error);
      return;
    }

    setLoading(true);
    const result = await sendTwoFactorOtp(phone);
    setLoading(false);

    if (result.success) {
      setStep('input_otp');
      setSessionId(result.sessionId || '');
      setSuccessMsg(result.message || `OTP sent to +91 ${result.phone}`);
      setResendTimer(30);
    } else {
      setErrorMsg(result.error || 'Failed to send OTP. Check mobile number.');
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp || otp.trim().length < 4) {
      setErrorMsg('Please enter a valid OTP code.');
      return;
    }

    setLoading(true);
    const result = await verifyTwoFactorOtp(phone, otp, sessionId);
    setLoading(false);

    if (result.success) {
      setStep('verified');
      setVerifiedPhone(result.fullPhone || `+91 ${result.phone}`);
      setSuccessMsg('Mobile number verified successfully.');
      if (onSuccess) {
        onSuccess(result);
      }
    } else {
      setErrorMsg(result.error || 'Invalid OTP code. Please check and try again.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    if (resendCount >= 3) {
      setErrorMsg('OTP resend limit reached. Please try again later.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setResendCount((prev) => prev + 1);

    setLoading(true);
    const result = await sendTwoFactorOtp(phone);
    setLoading(false);

    if (result.success) {
      setSessionId(result.sessionId || '');
      setSuccessMsg(`New OTP sent to +91 ${result.phone}`);
      setResendTimer(40);
    } else {
      setErrorMsg(result.error || 'Could not resend OTP.');
    }
  };

  const resetForm = () => {
    setStep('input_phone');
    setOtp('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className={`bg-white border border-sky-100 rounded-3xl p-5 sm:p-6 shadow-lg shadow-sky-500/5 space-y-4 ${compact ? 'max-w-full' : 'max-w-md mx-auto'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-md">
          2Factor Mobile OTP Login
        </span>
        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Auth</span>
        </div>
      </div>

      {step === 'input_phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-bold text-xs text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                required
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
            <p className="text-[11px] text-slate-400">Enter 10-digit mobile number</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 text-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {step === 'input_otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Enter OTP <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] font-bold text-sky-600 hover:underline"
              >
                Change +91 {phone}
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              placeholder="──────"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.5em] text-lg font-black py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-2.5 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 text-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying OTP...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || loading || resendCount >= 3}
              className="text-slate-600 hover:text-sky-600 disabled:text-slate-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </span>
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {step === 'verified' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-emerald-900 font-bold text-sm">
              Mobile number verified successfully
            </h3>
            <p className="text-emerald-700 font-mono font-bold text-xs mt-1">
              {verifiedPhone}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
