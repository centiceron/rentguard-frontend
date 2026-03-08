"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentGatewayProps {
  amount: number;
  purpose: string; // e.g., "Government E-Stamp Duty" or "Monthly Rent"
  payeeName: string; // e.g., "Govt. of India (SHCIL)" or Landlord's Name
  onSuccess: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export default function PaymentGateway({
  amount,
  purpose,
  payeeName,
  onSuccess,
  onCancel,
  onClose,
}: PaymentGatewayProps) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("upi");

  const handleSimulatePayment = () => {
    setProcessing(true);
    // Simulate network delay and bank processing
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      // Wait 1.5 seconds so they see the green checkmark before closing
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2500);
  };

  if (success) {
    return (
      <div className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in'>
        <div className='bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full transform transition-all animate-in zoom-in-90'>
          <div className='h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6'>
            <CheckCircle className='h-10 w-10 text-green-600' />
          </div>
          <h2 className='text-2xl font-extrabold text-slate-900 mb-2'>
            Payment Successful
          </h2>
          <p className='text-slate-500 text-center mb-6'>
            ₹{amount.toLocaleString("en-IN")} paid to {payeeName}
          </p>
          <div className='w-full bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 flex justify-between'>
            <span>Txn ID:</span>
            <span className='font-mono font-bold text-slate-900'>
              TXN{Math.floor(Math.random() * 1000000000)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in p-4'>
      <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]'>
        {/* Header */}
        <div className='bg-slate-900 p-6 text-white relative flex-shrink-0'>
          <button
            onClick={onCancel}
            className='absolute top-4 right-4 text-slate-400 hover:text-white transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
          <div className='flex items-center gap-2 mb-4 text-emerald-400'>
            <ShieldCheck className='h-5 w-5' />
            <span className='text-xs font-bold uppercase tracking-widest'>
              Secured by RentGuard Pay
            </span>
          </div>
          <p className='text-slate-400 text-sm mb-1'>{purpose}</p>
          <h2 className='text-3xl font-extrabold flex items-center gap-1'>
            <span className='text-slate-500'>₹</span>
            {amount.toLocaleString("en-IN")}
          </h2>
          <p className='text-xs text-slate-400 mt-2'>
            Paying to:{" "}
            <span className='font-semibold text-slate-200'>{payeeName}</span>
          </p>
        </div>

        {/* Body - Payment Methods */}
        <div className='p-6 overflow-y-auto flex-1 bg-slate-50'>
          <p className='text-sm font-bold text-slate-700 mb-4'>
            Select Payment Method
          </p>

          <div className='space-y-3'>
            <label
              className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedMethod === "upi" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <input
                type='radio'
                name='method'
                checked={selectedMethod === "upi"}
                onChange={() => setSelectedMethod("upi")}
                className='h-4 w-4 text-emerald-600 focus:ring-emerald-500'
              />
              <div className='h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0'>
                <Smartphone className='h-5 w-5 text-slate-600' />
              </div>
              <div className='flex-1'>
                <p className='font-bold text-slate-900'>UPI / QR</p>
                <p className='text-xs text-slate-500'>
                  Google Pay, PhonePe, Paytm
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedMethod === "card" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <input
                type='radio'
                name='method'
                checked={selectedMethod === "card"}
                onChange={() => setSelectedMethod("card")}
                className='h-4 w-4 text-emerald-600 focus:ring-emerald-500'
              />
              <div className='h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0'>
                <CreditCard className='h-5 w-5 text-slate-600' />
              </div>
              <div className='flex-1'>
                <p className='font-bold text-slate-900'>Credit / Debit Card</p>
                <p className='text-xs text-slate-500'>
                  Visa, Mastercard, RuPay
                </p>
              </div>
            </label>

            <label
              className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedMethod === "netbanking" ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <input
                type='radio'
                name='method'
                checked={selectedMethod === "netbanking"}
                onChange={() => setSelectedMethod("netbanking")}
                className='h-4 w-4 text-emerald-600 focus:ring-emerald-500'
              />
              <div className='h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0'>
                <Building2 className='h-5 w-5 text-slate-600' />
              </div>
              <div className='flex-1'>
                <p className='font-bold text-slate-900'>Net Banking</p>
                <p className='text-xs text-slate-500'>All major Indian banks</p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 bg-white border-t border-slate-100 flex-shrink-0'>
          <Button
            onClick={handleSimulatePayment}
            disabled={processing}
            className='w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all'
          >
            {processing ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='animate-spin h-5 w-5' /> Processing
                Securely...
              </span>
            ) : (
              `Pay ₹${amount.toLocaleString("en-IN")}`
            )}
          </Button>
          <div className='flex items-center justify-center gap-1 mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold'>
            <ShieldCheck className='h-3 w-3' /> 256-bit Bank Grade Encryption
          </div>
        </div>
      </div>
    </div>
  );
}
