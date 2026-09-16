"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface SopAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  partner?: any;
  onBookingUpdated?: (updatedBooking: any) => void;
}

export default function SopAuditDrawer({
  isOpen,
  onClose,
  booking,
  partner,
  onBookingUpdated,
}: SopAuditDrawerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [isPurgingAll, setIsPurgingAll] = useState(false);

  if (!isOpen || !booking) return null;

  const timestamps = booking.step_timestamps || {};

  const formatStageTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calculateDuration = (startIso?: string, endIso?: string) => {
    if (!startIso || !endIso) return null;
    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
    if (diffMs <= 0) return "0 min";
    const mins = Math.round(diffMs / (1000 * 60));
    return `${mins} min`;
  };

  const extractStoragePath = (publicUrl: string): string | null => {
    try {
      const marker = "/job-verifications/";
      const idx = publicUrl.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(publicUrl.slice(idx + marker.length).split("?")[0]);
    } catch {
      return null;
    }
  };

  const handleDeletePhoto = async (columnKey: string, publicUrl?: string) => {
    if (!publicUrl) return;
    const confirmed = confirm(
      "Are you sure you want to delete this verification photo? This will free up storage."
    );
    if (!confirmed) return;

    setDeletingKey(columnKey);

    try {
      const filePath = extractStoragePath(publicUrl);
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("job-verifications")
          .remove([filePath]);

        if (storageError) {
          console.warn("Storage deletion error (continuing DB update):", storageError.message);
        }
      }

      const { data: updated, error: dbError } = await supabase
        .from("booking")
        .update({ [columnKey]: null })
        .eq("id", booking.id)
        .select()
        .single();

      if (dbError) {
        alert("Failed to update booking: " + dbError.message);
      } else if (onBookingUpdated && updated) {
        onBookingUpdated(updated);
      }
    } catch (err: any) {
      alert("Error deleting photo: " + err.message);
    } finally {
      setDeletingKey(null);
    }
  };

  const handlePurgeAllAuditMedia = async () => {
    const confirmed = confirm(
      "Purge all verification media for this wash? This permanently removes the images from Supabase Storage while preserving timestamps."
    );
    if (!confirmed) return;

    setIsPurgingAll(true);

    const photos = [
      booking.partner_arrival_selfie,
      booking.pre_wash_kit_photo,
      booking.post_wash_photo_1,
      booking.post_wash_photo_2,
    ].filter(Boolean);

    const filePaths = photos
      .map((url) => extractStoragePath(url))
      .filter((p): p is string => Boolean(p));

    try {
      if (filePaths.length > 0) {
        await supabase.storage.from("job-verifications").remove(filePaths);
      }

      const { data: updated, error } = await supabase
        .from("booking")
        .update({
          partner_arrival_selfie: null,
          pre_wash_kit_photo: null,
          post_wash_photo_1: null,
          post_wash_photo_2: null,
        })
        .eq("id", booking.id)
        .select()
        .single();

      if (!error && onBookingUpdated && updated) {
        onBookingUpdated(updated);
      }
    } catch (err: any) {
      alert("Error purging audit media: " + err.message);
    } finally {
      setIsPurgingAll(false);
    }
  };

  const stages = [
    {
      title: "1. Order Dispatched",
      target: "Target: ~0m",
      time: formatStageTime(timestamps.dispatched_at),
      duration: null,
      passed: Boolean(timestamps.dispatched_at),
    },
    {
      title: "2. Partner Arrived at Site",
      target: "Target: ~15m",
      time: formatStageTime(timestamps.arrived_at),
      duration: calculateDuration(timestamps.dispatched_at, timestamps.arrived_at),
      passed: Boolean(timestamps.arrived_at),
    },
    {
      title: "3. Pre-Wash Inspection & Photos",
      target: "Target: ~5m",
      time: formatStageTime(timestamps.inspection_done_at),
      duration: calculateDuration(timestamps.arrived_at, timestamps.inspection_done_at),
      passed: Boolean(timestamps.inspection_done_at),
    },
    {
      title: "4. Foam & High-Pressure Wash",
      target: "Target: ~20m",
      time: formatStageTime(timestamps.wash_done_at),
      duration: calculateDuration(timestamps.inspection_done_at, timestamps.wash_done_at),
      passed: Boolean(timestamps.wash_done_at),
    },
    {
      title: "5. Wash Finished & Closed",
      target: "Target: ~5m",
      time: formatStageTime(timestamps.completed_at),
      duration: calculateDuration(timestamps.wash_done_at, timestamps.completed_at),
      passed: Boolean(timestamps.completed_at),
    },
  ];

  const hasAnyPhotos = Boolean(
    booking.partner_arrival_selfie ||
      booking.pre_wash_kit_photo ||
      booking.post_wash_photo_1 ||
      booking.post_wash_photo_2
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                #{booking.id.slice(0, 8).toUpperCase()}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">SOP Progress Audit</h2>
              <p className="text-xs text-slate-500">Live timeline & time taken per stage</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-sm font-black"
            >
              ✕
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-800">
                Assigned: {partner?.full_name || "Unassigned"}
              </span>
              <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {booking.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {booking.name} • {booking.car_company} {booking.car_model} ({booking.car_number || "No Plate"})
            </p>
            <p className="text-xs text-slate-400">📍 {booking.location_address}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              SOP Execution Timeline
            </h3>

            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        stage.passed
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {stage.passed ? "✓" : idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{stage.title}</p>
                      <p className="text-[10px] text-slate-400">{stage.target}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-700 font-mono">{stage.time}</p>
                    {stage.duration && (
                      <p className="text-[10px] font-black text-rose-600">Took {stage.duration}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Verification Photos (Partner Upload)
              </h3>
              {hasAnyPhotos && (
                <button
                  type="button"
                  onClick={handlePurgeAllAuditMedia}
                  disabled={isPurgingAll}
                  className="text-[10px] font-black uppercase text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition"
                >
                  {isPurgingAll ? "Purging..." : "Purge All Media 🗑️"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">
                  1. Live Security Selfie
                </span>
                {booking.partner_arrival_selfie ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img
                      src={booking.partner_arrival_selfie}
                      alt="Arrival Selfie"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedImage(booking.partner_arrival_selfie)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto("partner_arrival_selfie", booking.partner_arrival_selfie)}
                      disabled={deletingKey === "partner_arrival_selfie"}
                      className="absolute top-1.5 right-1.5 bg-red-600/90 text-white rounded-lg p-1 text-[10px] font-black hover:bg-red-700 shadow-md"
                      title="Delete Photo from Supabase"
                    >
                      {deletingKey === "partner_arrival_selfie" ? "..." : "🗑️"}
                    </button>
                  </div>
                ) : (
                  <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-lg">📸</span>
                    <span className="text-[10px] font-medium">Bypassed / Pending</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">
                  2. Wash Kit & Tank
                </span>
                {booking.pre_wash_kit_photo ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img
                      src={booking.pre_wash_kit_photo}
                      alt="Kit Photo"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedImage(booking.pre_wash_kit_photo)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto("pre_wash_kit_photo", booking.pre_wash_kit_photo)}
                      disabled={deletingKey === "pre_wash_kit_photo"}
                      className="absolute top-1.5 right-1.5 bg-red-600/90 text-white rounded-lg p-1 text-[10px] font-black hover:bg-red-700 shadow-md"
                      title="Delete Photo from Supabase"
                    >
                      {deletingKey === "pre_wash_kit_photo" ? "..." : "🗑️"}
                    </button>
                  </div>
                ) : (
                  <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-lg">🧽</span>
                    <span className="text-[10px] font-medium">No Kit Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">
                  3. Clean Plate View
                </span>
                {booking.post_wash_photo_1 ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img
                      src={booking.post_wash_photo_1}
                      alt="Plate Photo"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedImage(booking.post_wash_photo_1)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto("post_wash_photo_1", booking.post_wash_photo_1)}
                      disabled={deletingKey === "post_wash_photo_1"}
                      className="absolute top-1.5 right-1.5 bg-red-600/90 text-white rounded-lg p-1 text-[10px] font-black hover:bg-red-700 shadow-md"
                      title="Delete Photo from Supabase"
                    >
                      {deletingKey === "post_wash_photo_1" ? "..." : "🗑️"}
                    </button>
                  </div>
                ) : (
                  <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-lg">✨</span>
                    <span className="text-[10px] font-medium">No Plate Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 block">
                  4. Full Gloss Inspection
                </span>
                {booking.post_wash_photo_2 ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img
                      src={booking.post_wash_photo_2}
                      alt="Gloss Photo"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedImage(booking.post_wash_photo_2)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto("post_wash_photo_2", booking.post_wash_photo_2)}
                      disabled={deletingKey === "post_wash_photo_2"}
                      className="absolute top-1.5 right-1.5 bg-red-600/90 text-white rounded-lg p-1 text-[10px] font-black hover:bg-red-700 shadow-md"
                      title="Delete Photo from Supabase"
                    >
                      {deletingKey === "post_wash_photo_2" ? "..." : "🗑️"}
                    </button>
                  </div>
                ) : (
                  <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-lg">🚗</span>
                    <span className="text-[10px] font-medium">No Gloss Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
          >
            Close Drawer
          </button>
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={selectedImage}
              alt="Enlarged Audit"
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <p className="text-white text-xs font-bold mt-3">Click anywhere to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
}