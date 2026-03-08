"use client";

import React, { useState, useEffect } from "react";
import PaymentGateway from "./PaymentGateway";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  MapPin,
  Home,
  IndianRupee,
  Calendar,
  User,
  Mail,
  Smartphone,
  FileSignature,
  Users,
  Loader2,
  Edit3,
  FileText,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- HELPER COMPONENTS ---
const PhoneInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className='flex rounded-md shadow-sm'>
    <span className='inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 font-bold text-sm'>
      +91
    </span>
    <Input
      type='tel'
      maxLength={10}
      className='rounded-l-none pl-3 focus-visible:ring-indigo-500'
      placeholder='9876543210'
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  </div>
);

const RelationInput = ({
  typeValue,
  nameValue,
  onTypeChange,
  onNameChange,
}: {
  typeValue: string;
  nameValue: string;
  onTypeChange: (val: string) => void;
  onNameChange: (val: string) => void;
}) => (
  <div className='flex rounded-md shadow-sm gap-2'>
    <select
      className='w-24 px-2 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700'
      value={typeValue}
      onChange={(e) => onTypeChange(e.target.value)}
    >
      <option value='S/o'>S/o</option>
      <option value='D/o'>D/o</option>
      <option value='W/o'>W/o</option>
      <option value='C/o'>C/o</option>
    </select>
    <Input
      className='flex-1'
      placeholder="Relative's Full Name"
      value={nameValue}
      onChange={(e) => onNameChange(e.target.value)}
    />
  </div>
);

const indianStates = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

// 🔥 DEVELOPER MODE: Pre-configured test scenarios to bypass manual data entry
const mockLeaseScenarios: Record<string, any> = {
  maharashtra: {
    propertyAddress: "Flat 804, Sea View Towers, Bandra West, Mumbai, 400050",
    propertyState: "Maharashtra",
    monthlyRent: 45000,
    rentType: "Residential",
    leaseStartDate: "2026-05-01",
    leaseEndDate: "2027-03-31",
    landlordRelationType: "S/o",
    landlordRelationName: "R.K. Sharma",
    expectedTenantName: "Priya Desai",
    expectedTenantRelationType: "D/o",
    expectedTenantRelationName: "Mohan Desai",
    expectedTenantEmail: "priya.tenant@example.com",
    expectedTenantPhone: "9876500001",
    expectedTenantAddress:
      "402, Lotus Apartments, Andheri East, Mumbai, 400069",
    witness1Name: "Vikram Singh",
    witness1Phone: "9111122222",
    witness1Address: "101, Galaxy Heights, Khar West, Mumbai, 400052",
    witness2Name: "Neha Kapoor",
    witness2Phone: "9333344444",
    witness2Address: "305, Sunburst CHS, Juhu, Mumbai, 400049",
  },
  karnataka: {
    propertyAddress:
      "Flat 402, Sunshine Residency, HSR Layout Sector 2, Bangalore, 560102",
    propertyState: "Karnataka",
    monthlyRent: 25000,
    rentType: "Residential",
    leaseStartDate: "2026-04-01",
    leaseEndDate: "2027-02-28",
    landlordRelationType: "S/o",
    landlordRelationName: "R.K. Sharma",
    expectedTenantName: "Rahul Verma",
    expectedTenantRelationType: "S/o",
    expectedTenantRelationName: "Suresh Verma",
    expectedTenantEmail: "rahul.tenant.test@example.com",
    expectedTenantPhone: "9876543210",
    expectedTenantAddress:
      "88, Bluebell Apartments, Koramangala 4th Block, Bangalore, 560034",
    witness1Name: "Amit Patel",
    witness1Phone: "9123456789",
    witness1Address: "12A, Palm Grove, Jayanagar 9th Block, Bangalore, 560069",
    witness2Name: "Sneha Rao",
    witness2Phone: "9988776655",
    witness2Address: "45, Tech Park Road, Whitefield, Bangalore, 560066",
  },
};

// --- MAIN WIZARD ---
export default function LeaseWizard({
  onSuccess,
}: {
  onSuccess?: (leaseData: any) => void;
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State to hold the current lease ID returned from the backend
  const [currentLeaseId, setCurrentLeaseId] = useState<string | null>(null);
  // State to hold the generated PDF for preview
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  // State to control the display of the payment gateway
  const [showPayment, setShowPayment] = useState(false);

  const [landlordData, setLandlordData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [formData, setFormData] = useState({
    landlordRelationType: "S/o",
    landlordRelationName: "",
    propertyAddress: "",
    propertyState: "Karnataka",
    monthlyRent: "",
    rentPeriodMonths: 11,
    rentType: "Residential",
    leaseStartDate: "",
    leaseEndDate: "",
    expectedTenantName: "",
    expectedTenantRelationType: "S/o",
    expectedTenantRelationName: "",
    expectedTenantEmail: "",
    expectedTenantPhone: "",
    expectedTenantAddress: "",
    witness1Name: "",
    witness1Email: "",
    witness1Phone: "",
    witness1Address: "",
    witness2Name: "",
    witness2Email: "",
    witness2Phone: "",
    witness2Address: "",
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setLandlordData({
        name: user.name || "Verified Landlord",
        phone: user.phoneNumber || "",
        address: user.address || "Address missing from profile",
      });
    }
  }, []);

  const updateForm = (field: string, value: any) => {
    setErrorMsg("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (
        !formData.landlordRelationName ||
        !formData.propertyAddress ||
        !formData.monthlyRent ||
        !formData.leaseStartDate ||
        !formData.leaseEndDate
      ) {
        setErrorMsg(
          "Please fill in all required landlord and property fields, including dates.",
        );
        return false;
      }
    }
    if (step === 2) {
      if (
        !formData.expectedTenantName ||
        !formData.expectedTenantRelationName ||
        !formData.expectedTenantAddress ||
        !formData.expectedTenantPhone
      ) {
        setErrorMsg(
          "Tenant Name, Relation, Phone, and Permanent Address are mandatory.",
        );
        return false;
      }
      if (formData.expectedTenantPhone.length !== 10) {
        setErrorMsg("Tenant Mobile Number must be exactly 10 digits.");
        return false;
      }
    }
    if (step === 3) {
      if (
        !formData.witness1Name ||
        !formData.witness1Phone ||
        !formData.witness1Address ||
        !formData.witness2Name ||
        !formData.witness2Phone ||
        !formData.witness2Address
      ) {
        setErrorMsg(
          "Both witnesses must have a Name, Phone, and Permanent Address.",
        );
        return false;
      }
      if (
        formData.witness1Phone.length !== 10 ||
        formData.witness2Phone.length !== 10
      ) {
        setErrorMsg("Both Witness Mobile Numbers must be exactly 10 digits.");
        return false;
      }
    }
    return true;
  };

  // Auto-calculate rent period whenever dates change
  useEffect(() => {
    if (formData.leaseStartDate && formData.leaseEndDate) {
      const start = new Date(formData.leaseStartDate);
      const end = new Date(formData.leaseEndDate);

      if (end > start) {
        // Calculate base month difference
        let months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());

        // Legal calendar logic: Round up for partial months
        if (end.getDate() >= start.getDate()) {
          months += 1;
        }

        if (formData.rentPeriodMonths !== months) {
          updateForm("rentPeriodMonths", months);
        }
      } else {
        // INVALID DATES: Reset to 0
        if (formData.rentPeriodMonths !== 0) {
          updateForm("rentPeriodMonths", 0);
        }
      }
    }
  }, [formData.leaseStartDate, formData.leaseEndDate]);

  const nextStep = () => {
    if (validateStep()) {
      setStep((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep((p) => Math.max(p - 1, 1));
  };

  // 🔥 THE REAL BACKEND CONNECTION
  const handleGeneratePreview = async () => {
    setStep(5);
    setLoading(true);
    setGeneratedPdfUrl(null);

    const finalPayload = { ...formData, ...landlordData };
    console.log("Sending payload to Backend:", finalPayload);

    try {
      const userStr = localStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const response = await fetch("http://localhost:5000/api/lease/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(finalPayload),
      });

      // 💡 NEW: Parse as JSON instead of Blob
      const data = await response.json();
      setCurrentLeaseId(data.leaseId);

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate document");
      }

      // 💡 NEW: Convert the Base64 string directly into a PDF Data URL
      const pdfObjectUrl = `data:application/pdf;base64,${data.pdfBase64}`;
      setGeneratedPdfUrl(pdfObjectUrl);

      // (Optional) You can also save data.leaseId to state here if you need it for the payment step!
    } catch (error) {
      console.error("Error forging document:", error);
      setErrorMsg(
        "Failed to generate the lease. Please try again or check the backend terminal.",
      );
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalApprove = async () => {
    if (!currentLeaseId) return;
    setLoading(true);

    try {
      const userStr = localStorage.getItem("user");
      const token = userStr ? JSON.parse(userStr).token : "";

      const response = await fetch("http://localhost:5000/api/lease/stamp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leaseId: currentLeaseId }),
      });

      if (!response.ok) throw new Error("Payment failed");

      // 🔥 SUCCESS! Move to the final confirmation screen
      setStep(6);

      // (Optional) Tell the parent page it's done
      if (onSuccess) onSuccess({ success: true, leaseId: currentLeaseId });
    } catch (error) {
      console.error("Error stamping document:", error);
      setErrorMsg("Payment simulation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200'>
      {/* 🔥 NEW: DEVELOPER QUICK-FORGE TOOLBAR */}
      <div className='bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-800'>
        <div className='flex items-center gap-2 text-amber-400'>
          <FlaskConical className='h-4 w-4' />
          <span className='text-xs font-bold uppercase tracking-wider'>
            Dev Mode: Quick Fill
          </span>
        </div>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            className='h-8 text-xs bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            onClick={() =>
              setFormData((prev: any) => ({
                ...prev,
                ...mockLeaseScenarios.maharashtra,
              }))
            }
          >
            Load Maharashtra (Priya)
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='h-8 text-xs bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            onClick={() =>
              setFormData((prev: any) => ({
                ...prev,
                ...mockLeaseScenarios.karnataka,
              }))
            }
          >
            Load Karnataka (Rahul)
          </Button>
        </div>
      </div>

      {/* HEADER & PROGRESS BAR */}
      <div className='bg-slate-900 p-6 text-white'>
        <h2 className='text-xl font-bold mb-6 flex items-center gap-2'>
          <FileSignature className='h-6 w-6 text-indigo-400' />
          The Forge: Lease Generator
        </h2>

        <div className='flex items-center justify-between relative'>
          <div className='absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700 -z-0'></div>
          {/* Progress bar adjusted for 5 steps */}
          <div
            className='absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 transition-all duration-300 z-0'
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          ></div>
          {[
            { num: 1, label: "Terms" },
            { num: 2, label: "Tenant" },
            { num: 3, label: "Witnesses" },
            { num: 4, label: "Review" },
            { num: 5, label: "Preview" },
          ].map((s) => (
            <div
              key={s.num}
              className='relative z-10 flex flex-col items-center'
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-4 border-slate-900 transition-colors duration-300 ${step >= s.num ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"}`}
              >
                {step > s.num ? <CheckCircle2 className='h-5 w-5' /> : s.num}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${step >= s.num ? "text-indigo-300" : "text-slate-500"}`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className='bg-red-50 border-b border-red-200 p-4 flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2'>
          <AlertTriangle className='h-5 w-5 shrink-0' />
          <p className='text-sm font-bold'>{errorMsg}</p>
        </div>
      )}

      {/* FORM BODY */}
      <div className='p-8 min-h-[500px]'>
        {/* STEP 1: TERMS & DATES */}
        {step === 1 && (
          <div className='space-y-8 animate-in fade-in slide-in-from-right-4'>
            <div>
              <h3 className='text-lg font-bold text-slate-800 border-b pb-2 mb-4'>
                Your Details (Landlord)
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label>Legal Name</Label>
                  <Input
                    disabled
                    value={landlordData.name}
                    className='bg-slate-50 cursor-not-allowed text-slate-500'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>
                    Relationship <span className='text-red-500'>*</span>
                  </Label>
                  <RelationInput
                    typeValue={formData.landlordRelationType}
                    nameValue={formData.landlordRelationName}
                    onTypeChange={(val) =>
                      updateForm("landlordRelationType", val)
                    }
                    onNameChange={(val) =>
                      updateForm("landlordRelationName", val)
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-bold text-slate-800 border-b pb-2 mb-4'>
                Property & Rent Terms
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2 md:col-span-2'>
                  <Label>
                    Full Property Address{" "}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                    <Input
                      className='pl-10'
                      placeholder='Flat No, Building, Area, Pincode'
                      value={formData.propertyAddress}
                      onChange={(e) =>
                        updateForm("propertyAddress", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>
                    Property State <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                    <select
                      required
                      className='flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none'
                      value={formData.propertyState}
                      onChange={(e) =>
                        updateForm("propertyState", e.target.value)
                      }
                    >
                      <option value='' disabled>
                        Select a State / UT
                      </option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className='text-xs text-slate-400'>
                    *Dictates the local rent control laws applied to the AI
                    draft.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label>
                    Monthly Rent (₹) <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <IndianRupee className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                    <Input
                      type='number'
                      min='10'
                      className={`pl-10 ${formData.monthlyRent !== "" && Number(formData.monthlyRent) < 10 ? "border-red-500" : ""}`}
                      placeholder='e.g. 25000'
                      value={formData.monthlyRent}
                      onChange={(e) =>
                        updateForm(
                          "monthlyRent",
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                  </div>

                  {/* 🔥 THE CONSIDERATION VALIDATION WARNING */}
                  {formData.monthlyRent !== "" &&
                    Number(formData.monthlyRent) < 10 && (
                      <div className='flex items-center gap-2 mt-1 text-red-600 text-xs font-bold animate-in slide-in-from-top-1'>
                        <AlertTriangle className='h-3 w-3' />
                        <span>
                          Rent must be at least ₹10 to constitute valid legal
                          consideration.
                        </span>
                      </div>
                    )}
                </div>
                <div className='space-y-2'>
                  <Label>
                    Lease Start Date <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='date'
                    value={formData.leaseStartDate}
                    onChange={(e) =>
                      updateForm("leaseStartDate", e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>
                    Lease End Date <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='date'
                    value={formData.leaseEndDate}
                    onChange={(e) => updateForm("leaseEndDate", e.target.value)}
                    className={
                      new Date(formData.leaseStartDate) >=
                      new Date(formData.leaseEndDate)
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {formData.leaseStartDate &&
                    formData.leaseEndDate &&
                    new Date(formData.leaseStartDate) >=
                      new Date(formData.leaseEndDate) && (
                      <div className='flex items-center gap-2 mt-1 text-red-600 text-xs font-bold animate-in slide-in-from-top-1'>
                        <AlertTriangle className='h-3 w-3' />
                        <span>End date must be after the start date.</span>
                      </div>
                    )}
                </div>
                <div className='space-y-2'>
                  <Label>
                    Rent Period (Months) <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <Calendar className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                    <Input
                      type='number'
                      readOnly
                      className='pl-10 bg-slate-100 border-slate-200 text-slate-500 font-bold cursor-not-allowed'
                      value={formData.rentPeriodMonths}
                    />
                  </div>
                  <p className='text-xs text-slate-400 italic'>
                    *Auto-calculated based on start and end dates (rounded up).
                  </p>

                  {formData.rentPeriodMonths > 11 && (
                    <div className='flex items-start gap-2 mt-2 bg-amber-50 text-amber-800 p-3 rounded-md border border-amber-200 text-xs animate-in slide-in-from-top-2 duration-300'>
                      <AlertTriangle className='h-4 w-4 shrink-0 mt-0.5' />
                      <p>
                        <strong>Warning:</strong> Leases of 12+ months mandate
                        formal sub-registrar registration.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TENANT DETAILS */}
        {step === 2 && (
          <div className='space-y-6 animate-in fade-in slide-in-from-right-4'>
            <h3 className='text-lg font-bold text-slate-800 border-b pb-2'>
              Primary Tenant Details
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>
                  Legal Name <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <Input
                    className='pl-10'
                    placeholder='Full Name'
                    value={formData.expectedTenantName}
                    onChange={(e) =>
                      updateForm("expectedTenantName", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>
                  Relationship <span className='text-red-500'>*</span>
                </Label>
                <RelationInput
                  typeValue={formData.expectedTenantRelationType}
                  nameValue={formData.expectedTenantRelationName}
                  onTypeChange={(val) =>
                    updateForm("expectedTenantRelationType", val)
                  }
                  onNameChange={(val) =>
                    updateForm("expectedTenantRelationName", val)
                  }
                />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>
                  Permanent Address <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <MapPin className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <Input
                    className='pl-10'
                    placeholder="Tenant's Home Address"
                    value={formData.expectedTenantAddress}
                    onChange={(e) =>
                      updateForm("expectedTenantAddress", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Email Address</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <Input
                    type='email'
                    className='pl-10'
                    placeholder='tenant@example.com'
                    value={formData.expectedTenantEmail}
                    onChange={(e) =>
                      updateForm("expectedTenantEmail", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>
                  Mobile Number <span className='text-red-500'>*</span>
                </Label>
                <PhoneInput
                  value={formData.expectedTenantPhone}
                  onChange={(val) => updateForm("expectedTenantPhone", val)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WITNESSES */}
        {step === 3 && (
          <div className='space-y-8 animate-in fade-in slide-in-from-right-4'>
            <div>
              <div className='flex justify-between items-end border-b pb-2 mb-4'>
                <h3 className='text-lg font-bold text-slate-800 flex items-center gap-2'>
                  <Users className='h-5 w-5 text-slate-400' /> Witness 1
                </h3>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label>
                    Full Name <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Witness 1 Name'
                    value={formData.witness1Name}
                    onChange={(e) => updateForm("witness1Name", e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>
                    Mobile Number <span className='text-red-500'>*</span>
                  </Label>
                  <PhoneInput
                    value={formData.witness1Phone}
                    onChange={(val) => updateForm("witness1Phone", val)}
                  />
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <Label>
                    Permanent Address <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Witness 1 Address'
                    value={formData.witness1Address}
                    onChange={(e) =>
                      updateForm("witness1Address", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='flex justify-between items-end border-b pb-2 mb-4 mt-6'>
                <h3 className='text-lg font-bold text-slate-800 flex items-center gap-2'>
                  <Users className='h-5 w-5 text-slate-400' /> Witness 2
                </h3>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label>
                    Full Name <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Witness 2 Name'
                    value={formData.witness2Name}
                    onChange={(e) => updateForm("witness2Name", e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>
                    Mobile Number <span className='text-red-500'>*</span>
                  </Label>
                  <PhoneInput
                    value={formData.witness2Phone}
                    onChange={(val) => updateForm("witness2Phone", val)}
                  />
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <Label>
                    Permanent Address <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Witness 2 Address'
                    value={formData.witness2Address}
                    onChange={(e) =>
                      updateForm("witness2Address", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DATA REVIEW */}
        {step === 4 && (
          <div className='space-y-6 animate-in fade-in zoom-in-95'>
            <h3 className='text-xl font-bold text-slate-800 border-b pb-2 flex items-center gap-2'>
              <CheckCircle2 className='h-6 w-6 text-green-600' /> Final Payload
              Review
            </h3>

            <div className='bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-base'>
              <div className='grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200'>
                <div className='p-6 space-y-2'>
                  <span className='text-sm font-bold text-indigo-600 uppercase tracking-wider block mb-2'>
                    Landlord (First Party)
                  </span>
                  <p className='font-bold text-lg text-slate-900'>
                    {landlordData.name}
                  </p>
                  <p className='text-slate-700'>
                    {formData.landlordRelationType}{" "}
                    {formData.landlordRelationName}
                  </p>
                  <p className='text-slate-700'>{landlordData.phone}</p>
                  <p className='text-slate-600 font-medium mt-2 leading-relaxed'>
                    {landlordData.address}
                  </p>
                </div>
                <div className='p-6 space-y-2'>
                  <span className='text-sm font-bold text-indigo-600 uppercase tracking-wider block mb-2'>
                    Tenant (Second Party)
                  </span>
                  <p className='font-bold text-lg text-slate-900'>
                    {formData.expectedTenantName}
                  </p>
                  <p className='text-slate-700'>
                    {formData.expectedTenantRelationType}{" "}
                    {formData.expectedTenantRelationName}
                  </p>
                  <p className='text-slate-700'>
                    +91 {formData.expectedTenantPhone}
                  </p>
                  <p className='text-slate-600 font-medium mt-2 leading-relaxed'>
                    {formData.expectedTenantAddress}
                  </p>
                </div>
              </div>

              <div className='p-6 border-b border-slate-200 bg-white'>
                <span className='text-sm font-bold text-slate-500 uppercase tracking-wider block mb-3'>
                  Property & Terms
                </span>
                <div className='grid grid-cols-2 gap-6'>
                  <div>
                    <p className='text-slate-500 text-sm'>Leased Property</p>
                    <p className='font-semibold text-lg text-slate-900 leading-relaxed'>
                      {formData.propertyAddress}, {formData.propertyState}
                    </p>
                  </div>
                  <div>
                    <p className='text-slate-500 text-sm'>Rent Details</p>
                    <p className='font-semibold text-lg text-slate-900 mb-1'>
                      ₹{formData.monthlyRent} per month
                    </p>
                    <p className='text-slate-700 font-medium'>
                      From:{" "}
                      <span className='text-slate-900'>
                        {formData.leaseStartDate}
                      </span>{" "}
                      to{" "}
                      <span className='text-slate-900'>
                        {formData.leaseEndDate}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-2 divide-x divide-slate-200 bg-slate-50'>
                <div className='p-6 space-y-1'>
                  <span className='text-sm font-bold text-slate-500 uppercase tracking-wider block mb-2'>
                    Witness 1
                  </span>
                  <p className='font-bold text-slate-900'>
                    {formData.witness1Name}
                  </p>
                  <p className='text-slate-700'>+91 {formData.witness1Phone}</p>
                  <p className='text-slate-600 leading-relaxed mt-1'>
                    {formData.witness1Address}
                  </p>
                </div>
                <div className='p-6 space-y-1'>
                  <span className='text-sm font-bold text-slate-500 uppercase tracking-wider block mb-2'>
                    Witness 2
                  </span>
                  <p className='font-bold text-slate-900'>
                    {formData.witness2Name}
                  </p>
                  <p className='text-slate-700'>+91 {formData.witness2Phone}</p>
                  <p className='text-slate-600 leading-relaxed mt-1'>
                    {formData.witness2Address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 NEW STEP 5: PDF VIEWER */}
        {step === 5 && (
          <div className='space-y-6 animate-in slide-in-from-right-4'>
            <div className='flex justify-between items-center border-b pb-4'>
              <h3 className='text-xl font-bold text-slate-800 flex items-center gap-2'>
                <FileText className='h-6 w-6 text-indigo-600' /> Contract
                Preview
              </h3>
              <span className='bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-amber-200'>
                Draft Mode - Review Required
              </span>
            </div>

            <div className='bg-slate-200 rounded-lg p-2 h-[600px] w-full border border-slate-300 shadow-inner relative overflow-hidden'>
              {loading ? (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10'>
                  <div className='h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-lg'>
                    <Loader2 className='h-8 w-8 animate-spin text-indigo-600' />
                  </div>
                  <h4 className='text-lg font-bold text-slate-900'>
                    Forging Document...
                  </h4>
                  <p className='text-sm text-slate-500 mt-2'>
                    AWS Bedrock is drafting your custom legal clauses.
                  </p>
                </div>
              ) : generatedPdfUrl ? (
                <iframe
                  src={generatedPdfUrl}
                  className='w-full h-full rounded bg-white shadow-sm'
                  title='Lease Preview'
                />
              ) : (
                <div className='flex items-center justify-center h-full text-red-500'>
                  Failed to load preview.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🔥 STEP 6: SUCCESS SCREEN */}
        {step === 6 && (
          <div className='flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500'>
            <div className='h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner'>
              <CheckCircle2 className='h-12 w-12 text-green-600' />
            </div>
            <h3 className='text-3xl font-extrabold text-slate-900 mb-2'>
              Lease Forged & Stamped!
            </h3>
            <p className='text-slate-600 max-w-md mx-auto mb-8 text-lg'>
              The India Non-Judicial E-Stamp has been successfully applied to
              the document. It has been moved to your Digital Locker and is
              pending the Tenant's Handshake.
            </p>

            <div className='flex gap-4'>
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
                className='border-slate-300 text-slate-700 h-12 px-6'
              >
                Forge Another Lease
              </Button>
              <Button
                onClick={() => (window.location.href = "/landlord/dashboard")}
                className='bg-indigo-600 hover:bg-indigo-700 shadow-md h-12 px-6'
              >
                Go to Digital Locker <ChevronRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      {step < 6 && (
        <div className='p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center'>
          {step < 5 ? (
            <>
              {/* Back / Continue Buttons */}
              <Button
                variant='outline'
                onClick={prevStep}
                disabled={step === 1 || loading}
                className='text-slate-600 bg-white'
              >
                <ChevronLeft className='mr-1 h-4 w-4' /> Back
              </Button>
              {step < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    step === 1 &&
                    (!formData.leaseStartDate ||
                      !formData.leaseEndDate ||
                      new Date(formData.leaseStartDate) >=
                        new Date(formData.leaseEndDate) ||
                      !formData.propertyState ||
                      !formData.monthlyRent ||
                      Number(formData.monthlyRent) < 10)
                  }
                  className='bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Continue <ChevronRight className='ml-1 h-4 w-4' />
                </Button>
              ) : (
                <Button
                  onClick={handleGeneratePreview}
                  className='bg-indigo-600 hover:bg-indigo-700 shadow-md h-12 px-6 text-lg'
                >
                  {loading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  Generate Legal Document
                </Button>
              )}
            </>
          ) : (
            // Buttons for Step 5
            <div className='w-full flex gap-4'>
              <Button
                variant='outline'
                onClick={() => setStep(4)}
                disabled={loading}
                className='flex-1 border-slate-300 h-12 text-slate-700 bg-white hover:bg-slate-100'
              >
                Found an error? Go back & edit
              </Button>
              <Button
                onClick={() => setShowPayment(true)} // 🔥 Opens the gateway instead of bypassing
                disabled={loading}
                className='flex-1 bg-green-600 hover:bg-green-700 shadow-md h-12 text-lg text-white'
              >
                {loading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : null}
                Looks Perfect. Pay E-Stamp Duty
              </Button>
            </div>
          )}
        </div>
      )}
      {/* THE UNIVERSAL PAYMENT INTERCEPTOR */}
      {showPayment && (
        <PaymentGateway
          amount={500} // Standard mock stamp duty amount
          purpose='Government E-Stamp Duty Registration'
          payeeName='Stock Holding Corporation of India Ltd. (SHCIL)'
          onCancel={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false); // Close the modal
            handleFinalApprove(); // 🔥 NOW we actually generate the document!
          }}
        />
      )}
    </div>
  );
}
