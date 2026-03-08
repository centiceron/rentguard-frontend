"use strict";
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Building,
  PenTool,
  CheckCircle,
  FileDigit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WitnessGateway() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const leaseId = params.id as string;
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaseData, setLeaseData] = useState<any>(null);

  const [witnessIdentifier, setWitnessIdentifier] = useState("");
  const [signatureName, setSignatureName] = useState("");

  // DigiLocker Verification States
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!leaseId || !token) {
      setError("Malformed secure link.");
      setLoading(false);
      return;
    }
    verifyToken();
  }, [leaseId, token]);

  const verifyToken = async () => {
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/verify-witness?token=${token}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify link.");
      setLeaseData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: The DigiLocker Popup Logic
  const handleDigilockerPopup = () => {
    const popup = window.open(
      "/sandbox/digilocker",
      "DigiLocker Auth",
      "width=500,height=600,left=200,top=200",
    );

    const messageListener = (event: MessageEvent) => {
      if (event.data?.type === "DIGILOCKER_SUCCESS") {
        const payload = event.data.payload;
        // Save the Aadhaar number for the backend signature stamp
        setAadhaarNumber(payload.aadhaar);
        setIsAadhaarVerified(true);
        window.removeEventListener("message", messageListener);
      } else if (event.data?.type === "DIGILOCKER_FAILED") {
        alert(event.data.error || "Verification failed.");
        window.removeEventListener("message", messageListener);
      }
    };

    window.addEventListener("message", messageListener);
  };

  const handleSign = async () => {
    if (
      !witnessIdentifier.trim() ||
      !signatureName.trim() ||
      !isAadhaarVerified
    ) {
      return alert("Please complete all identity verification steps.");
    }
    setSigning(true);
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/sign-witness?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            witnessIdentifier,
            signatureName,
            aadhaarNumber,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply signature.");

      setSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading)
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <Loader2 className='animate-spin h-10 w-10 text-indigo-600' />
      </div>
    );

  if (error) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <div className='bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500'>
          <ShieldAlert className='h-16 w-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-extrabold text-slate-900 mb-2'>
            Access Denied
          </h2>
          <p className='text-slate-600 mb-6'>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className='min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center'>
        <div className='h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6'>
          <CheckCircle className='h-12 w-12 text-green-600' />
        </div>
        <h2 className='text-3xl font-extrabold text-slate-900 mb-2'>
          Signature Applied!
        </h2>
        <p className='text-slate-600 max-w-md mx-auto'>
          Thank you for acting as a witness. The document has been
          cryptographically updated. You may now close this window.
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden'>
      <div className='absolute top-[-10%] left-[-10%] w-96 h-96 bg-fuchsia-600/20 blur-3xl rounded-full' />
      <div className='bg-white p-8 md:p-10 rounded-2xl shadow-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-500'>
        <div className='flex items-center gap-3 mb-6 border-b border-slate-100 pb-4'>
          <div className='h-12 w-12 bg-fuchsia-100 rounded-full flex items-center justify-center shrink-0'>
            <ShieldCheck className='h-6 w-6 text-fuchsia-600' />
          </div>
          <div>
            <h1 className='text-xl font-extrabold text-slate-900 leading-tight'>
              Witness Verification
            </h1>
            <p className='text-sm text-slate-500'>
              Zero-Trust Identity Gateway
            </p>
          </div>
        </div>

        <div className='bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6'>
          <p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-1'>
            Property Subject to Lease
          </p>
          <p className='text-slate-800 font-medium flex items-center gap-2'>
            <Building className='h-4 w-4 text-fuchsia-500' />
            {leaseData?.propertyAddress}
          </p>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-bold text-slate-700 mb-1'>
              I am signing as (Select your name):
            </label>
            <div className='grid grid-cols-1 gap-2'>
              <label
                className={`border p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${leaseData?.w1Signed ? "bg-slate-100 opacity-50 cursor-not-allowed" : witnessIdentifier === leaseData?.witness1Name ? "border-fuchsia-600 bg-fuchsia-50" : "hover:border-slate-300"}`}
              >
                <input
                  type='radio'
                  name='witness'
                  disabled={leaseData?.w1Signed}
                  checked={witnessIdentifier === leaseData?.witness1Name}
                  onChange={() => setWitnessIdentifier(leaseData?.witness1Name)}
                  className='h-4 w-4 text-fuchsia-600'
                />
                <span className='font-medium text-slate-800'>
                  {leaseData?.witness1Name}{" "}
                  {leaseData?.w1Signed && "(Already Signed)"}
                </span>
              </label>
              <label
                className={`border p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${leaseData?.w2Signed ? "bg-slate-100 opacity-50 cursor-not-allowed" : witnessIdentifier === leaseData?.witness2Name ? "border-fuchsia-600 bg-fuchsia-50" : "hover:border-slate-300"}`}
              >
                <input
                  type='radio'
                  name='witness'
                  disabled={leaseData?.w2Signed}
                  checked={witnessIdentifier === leaseData?.witness2Name}
                  onChange={() => setWitnessIdentifier(leaseData?.witness2Name)}
                  className='h-4 w-4 text-fuchsia-600'
                />
                <span className='font-medium text-slate-800'>
                  {leaseData?.witness2Name}{" "}
                  {leaseData?.w2Signed && "(Already Signed)"}
                </span>
              </label>
            </div>
          </div>

          {/* 🔥 NEW: Replaced Manual Input with DigiLocker Gateway */}
          <div className='pt-2'>
            <label className='block text-sm font-bold text-slate-700 mb-1'>
              Verify Identity
            </label>
            {!isAadhaarVerified ? (
              <Button
                type='button'
                onClick={handleDigilockerPopup}
                className='w-full bg-slate-900 hover:bg-slate-800 h-11'
              >
                <ShieldCheck className='h-4 w-4 mr-2' /> Verify with DigiLocker
              </Button>
            ) : (
              <div className='relative animate-in zoom-in-95 duration-200'>
                <FileDigit className='absolute left-3 top-3 h-4 w-4 text-green-600' />
                <Input
                  type='text'
                  readOnly
                  className='pl-10 bg-green-50 border-green-200 text-green-700 font-bold cursor-not-allowed'
                  value={`Aadhaar Verified: ${aadhaarNumber}`}
                />
              </div>
            )}
          </div>

          <div>
            <label className='block text-sm font-bold text-slate-700 mb-1'>
              Adopt E-Signature
            </label>
            <div className='relative'>
              <PenTool className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
              <Input
                type='text'
                placeholder='Type your full legal name'
                className='pl-10'
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                disabled={!isAadhaarVerified} // Prevent typing until verified
              />
            </div>
          </div>

          {signatureName && isAadhaarVerified && (
            <div className='p-3 bg-slate-50 border border-slate-200 rounded-lg text-center animate-in fade-in'>
              <p className='font-serif italic text-2xl text-fuchsia-900'>
                {signatureName}
              </p>
            </div>
          )}

          <Button
            onClick={handleSign}
            disabled={
              !witnessIdentifier ||
              !signatureName ||
              !isAadhaarVerified ||
              signing
            }
            className='w-full h-12 bg-fuchsia-600 hover:bg-fuchsia-700 text-lg shadow-md mt-4 transition-all'
          >
            {signing ? (
              <Loader2 className='animate-spin h-5 w-5 mx-auto' />
            ) : (
              "Verify & Apply Signature"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
