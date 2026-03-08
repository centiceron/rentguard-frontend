import React, { useState } from "react";
import {
  Sparkles,
  CreditCard,
  XCircle,
  ShieldAlert,
  Loader2,
  MailWarning,
  FileDown,
  ChevronLeft,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeaseCommandCenter({
  lease,
  onClose,
  userToken,
  role = "tenant",
  onTerminate,
}: any) {
  const isTerminated = lease.documentStatus === "Terminated";
  const [isScanning, setIsScanning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // NEW AUTOPAY STATES
  const [rightPanel, setRightPanel] = useState<"actions" | "autopay">(
    "actions",
  );
  const [autopayStep, setAutopayStep] = useState<
    "setup" | "processing" | "success"
  >("setup");
  const [upiId, setUpiId] = useState("");
  const [autopayActive, setAutopayActive] = useState(
    lease.isAutopayActive || false,
  );

  const handleAiScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/analyze-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            pdfBase64: lease.pdfBase64,
            isExternal: false,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) setAiAnalysis(data.analysis);
    } catch (error) {
      console.error(error);
    }
    setIsScanning(false);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${lease.pdfBase64}`;
    link.download = `LeaseAgreement_${lease.expectedTenantName.replace(/\s+/g, "_")}.pdf`;
    link.click();
  };

  const handleSetupAutopay = () => {
    if (!upiId.includes("@"))
      return alert("Please enter a valid UPI ID (e.g. name@okicici)");

    setAutopayStep("processing");

    // Simulate waiting for the user to open GPay/PhonePe and approve
    setTimeout(async () => {
      try {
        // ACTUAL BACKEND CALL TO SAVE THE STATUS
        const res = await fetch(
          `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${lease._id}/autopay`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${userToken}` },
          },
        );

        if (res.ok) {
          setAutopayStep("success");
          setAutopayActive(true);

          // Auto-return to the main actions panel after showing success
          setTimeout(() => {
            setRightPanel("actions");
            setAutopayStep("setup"); // Reset for next time
          }, 3000);
        }
      } catch (error) {
        console.error("Autopay setup failed", error);
        alert("Network error. Please try again.");
        setAutopayStep("setup");
      }
    }, 4000); // 4 seconds of fake "processing" to look cool
  };

  return (
    <div className='fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4'>
      <div className='bg-slate-50 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden border border-slate-700 animate-in zoom-in-95'>
        {/* LEFT SIDE: The Document Viewer */}
        <div className='w-2/3 bg-slate-300 border-r border-slate-200 h-full relative'>
          <div className='absolute top-0 w-full bg-slate-900 text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-md z-10'>
            <span>Official Legal Document</span>
            <span className='bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs'>
              Cryptographically Secured
            </span>
          </div>
          <iframe
            src={`data:application/pdf;base64,${lease.pdfBase64}#toolbar=0`}
            className='w-full h-full pt-9'
            title='Lease Document'
          />
        </div>

        {/* RIGHT SIDE: Dynamic Action Panel */}
        <div className='w-1/3 bg-white h-full flex flex-col relative overflow-hidden'>
          {/* ========================================== */}
          {/* PANEL 1: MAIN LEASE ACTIONS */}
          {/* ========================================== */}
          <div
            className={`absolute inset-0 flex flex-col transition-transform duration-500 ${rightPanel === "actions" ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className='p-6 border-b border-slate-100'>
              <div className='flex justify-between items-start mb-2'>
                <div className='flex items-center gap-3'>
                  <h2 className='text-2xl font-black text-slate-900'>
                    Lease Actions
                  </h2>
                  {isTerminated && (
                    <span className='bg-red-100 text-red-700 text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider mt-1'>
                      Terminated
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className='text-slate-400 hover:text-red-500'
                >
                  <XCircle className='h-6 w-6' />
                </button>
              </div>
              <p className='text-sm text-slate-500'>
                Manage your rental agreement and setup automated services.
              </p>
            </div>

            <div className='p-6 space-y-4 flex-1 overflow-y-auto'>
              {/* TENANT TOOLS */}
              {role === "tenant" && (
                <>
                  <div className='bg-violet-50 border border-violet-100 rounded-xl p-5'>
                    <h3 className='font-bold text-violet-900 mb-2 flex items-center gap-2'>
                      <Sparkles className='h-5 w-5 text-violet-600' /> AI Risk
                      Audit
                    </h3>
                    {!aiAnalysis && !isScanning && (
                      <Button
                        onClick={handleAiScan}
                        className='w-full bg-violet-600 hover:bg-violet-700 text-white shadow-md'
                      >
                        Scan Document for Risks
                      </Button>
                    )}
                    {isScanning && (
                      <div className='flex items-center justify-center py-4 text-violet-600'>
                        <Loader2 className='h-6 w-6 animate-spin mr-2' />{" "}
                        Analyzing Clauses...
                      </div>
                    )}
                    {aiAnalysis && (
                      <div className='space-y-3 mt-3 animate-in fade-in'>
                        <div className='flex items-center justify-between bg-white p-3 rounded-lg border border-violet-100 shadow-sm'>
                          <span className='text-xs font-bold text-slate-500 uppercase'>
                            Fairness Score
                          </span>
                          <span
                            className={`text-lg font-black ${aiAnalysis.fairnessScore >= 80 ? "text-green-600" : "text-amber-500"}`}
                          >
                            {aiAnalysis.fairnessScore}/100
                          </span>
                        </div>
                        <div className='bg-white p-3 rounded-lg border border-violet-100 shadow-sm'>
                          <span className='text-xs font-bold text-slate-500 uppercase block mb-1'>
                            Financial Summary
                          </span>
                          <p className='text-sm text-slate-700'>
                            {aiAnalysis.financialSummary}
                          </p>
                        </div>
                        <div className='bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-sm'>
                          <span className='text-xs font-bold text-amber-700 uppercase block mb-1 flex items-center gap-1'>
                            <ShieldAlert className='h-3 w-3' /> Red Flags
                          </span>
                          <p className='text-sm text-amber-900'>
                            {aiAnalysis.redFlags}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AUTOPAY TRIGGER CARD */}
                  <div
                    className={`border rounded-xl p-5 ${autopayActive ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className='flex justify-between items-center mb-2'>
                      <h3
                        className={`font-bold flex items-center gap-2 ${autopayActive ? "text-green-800" : "text-slate-800"}`}
                      >
                        <CreditCard
                          className={`h-5 w-5 ${autopayActive ? "text-green-600" : "text-slate-600"}`}
                        />{" "}
                        Rent Autopay
                      </h3>
                      {autopayActive && (
                        <span className='bg-green-200 text-green-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1'>
                          <CheckCircle2 className='h-3 w-3' /> Active
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs mb-3 ${autopayActive ? "text-green-700" : "text-slate-500"}`}
                    >
                      {autopayActive
                        ? `₹${lease.monthlyRent} will be auto-deducted on the 1st of every month.`
                        : "Set up automatic UPI mandates so you never miss a payment."}
                    </p>
                    {!autopayActive && (
                      <Button
                        variant='outline'
                        onClick={() => setRightPanel("autopay")}
                        className='w-full border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50'
                        disabled={isTerminated}
                      >
                        {isTerminated
                          ? "Unavailable (Terminated)"
                          : "Configure Autopay"}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* LANDLORD TOOLS ... (Remains identical) */}
              {role === "landlord" && (
                <>
                  <div className='bg-slate-50 border border-slate-200 rounded-xl p-5'>
                    <h3 className='font-bold text-slate-800 mb-2 flex items-center gap-2'>
                      <FileDown className='h-5 w-5 text-slate-600' /> Download
                      PDF
                    </h3>
                    <p className='text-xs text-slate-500 mb-3'>
                      Save a local copy of the cryptographically signed
                      agreement.
                    </p>
                    <Button
                      onClick={handleDownload}
                      variant='outline'
                      className='w-full border-slate-300 text-slate-700 hover:bg-slate-100'
                    >
                      Download Offline Copy
                    </Button>
                  </div>
                  <div className='bg-amber-50 border border-amber-200 rounded-xl p-5'>
                    <h3 className='font-bold text-amber-800 mb-2 flex items-center gap-2'>
                      <MailWarning className='h-5 w-5 text-amber-600' /> Send
                      Legal Notice
                    </h3>
                    <p className='text-xs text-amber-700/80 mb-3'>
                      Issue a formal warning for late rent or compliance
                      violations.
                    </p>
                    <Button
                      disabled={isTerminated}
                      className='w-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:bg-amber-300'
                    >
                      {isTerminated ? "Unavailable" : "Draft Notice"}
                    </Button>
                  </div>
                </>
              )}

              {/* TERMINATE (Universal) */}
              <div className='bg-red-50 border border-red-100 rounded-xl p-5 mt-auto'>
                <h3 className='font-bold text-red-800 mb-2 flex items-center gap-2'>
                  <XCircle className='h-5 w-5 text-red-600' /> Terminate
                  Agreement
                </h3>
                <p className='text-xs text-red-600/80 mb-3'>
                  Initiate a formal legal termination request.
                </p>
                <Button
                  variant='destructive'
                  className='w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500'
                  disabled={isTerminated}
                  onClick={() => {
                    onClose();
                    if (onTerminate) onTerminate(lease._id);
                  }}
                >
                  {isTerminated ? "Already Terminated" : "Request Termination"}
                </Button>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* PANEL 2: AUTOPAY SETUP WIZARD */}
          {/* ========================================== */}
          <div
            className={`absolute inset-0 flex flex-col bg-white transition-transform duration-500 ${rightPanel === "autopay" ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className='p-6 border-b border-slate-100 flex items-center gap-3'>
              <button
                onClick={() => setRightPanel("actions")}
                disabled={autopayStep === "processing"}
                className='p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors disabled:opacity-50'
              >
                <ChevronLeft className='h-5 w-5' />
              </button>
              <div>
                <h2 className='text-xl font-black text-slate-900'>
                  Setup Mandate
                </h2>
                <p className='text-xs text-slate-500'>
                  Powered by RentGuard Payments
                </p>
              </div>
            </div>

            <div className='p-6 flex-1 flex flex-col justify-center'>
              {autopayStep === "setup" && (
                <div className='animate-in fade-in slide-in-from-right-4 space-y-6'>
                  <div className='text-center mb-6'>
                    <div className='h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                      <CreditCard className='h-8 w-8 text-indigo-600' />
                    </div>
                    <h3 className='text-lg font-bold text-slate-900'>
                      Monthly Rent: ₹{lease.monthlyRent}
                    </h3>
                    <p className='text-sm text-slate-500 mt-1'>
                      Amount will be deducted on the 1st of every month
                      automatically.
                    </p>
                  </div>

                  <div>
                    <label className='block text-sm font-bold text-slate-700 mb-2'>
                      Enter UPI ID for e-Mandate
                    </label>
                    <input
                      type='text'
                      placeholder='e.g. 9876543210@ybl'
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className='w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none'
                    />
                  </div>

                  <Button
                    onClick={handleSetupAutopay}
                    className='w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6 shadow-lg'
                  >
                    Verify & Setup Mandate
                  </Button>
                </div>
              )}

              {autopayStep === "processing" && (
                <div className='text-center animate-in zoom-in-95 space-y-6'>
                  <div className='relative mx-auto w-24 h-24'>
                    <div className='absolute inset-0 border-4 border-indigo-100 rounded-full animate-pulse'></div>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <Smartphone className='h-10 w-10 text-indigo-600 animate-bounce' />
                    </div>
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-slate-900 mb-2'>
                      Check your phone
                    </h3>
                    <p className='text-slate-500 leading-relaxed'>
                      We've sent an Autopay mandate request to <br />
                      <strong className='text-indigo-600'>{upiId}</strong>.{" "}
                      <br />
                      Please open your UPI app to authorize it.
                    </p>
                  </div>
                  <div className='flex justify-center gap-2 mt-4'>
                    <Loader2 className='h-5 w-5 text-slate-400 animate-spin' />
                    <span className='text-sm font-medium text-slate-400'>
                      Waiting for approval...
                    </span>
                  </div>
                </div>
              )}

              {autopayStep === "success" && (
                <div className='text-center animate-in zoom-in-95 space-y-4'>
                  <div className='h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <CheckCircle2 className='h-10 w-10 text-green-600' />
                  </div>
                  <h3 className='text-2xl font-black text-green-700'>
                    Autopay Configured!
                  </h3>
                  <p className='text-slate-600'>
                    Your rent of ₹{lease.monthlyRent} will be paid
                    automatically. You can cancel this mandate at any time from
                    your bank app.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
