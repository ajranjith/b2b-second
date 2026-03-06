"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@repo/ui";
import { type Announcement } from "@/lib/mock/dealerData";
import { Paperclip } from "lucide-react";

type MessageDrawerProps = {
  open: boolean;
  announcement: Announcement | null;
  onClose: () => void;
};

export function MessageDrawer({ open, announcement, onClose }: MessageDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={(state) => (!state ? onClose() : null)}>
      <DialogContent className="right-0 left-auto top-0 bottom-0 h-screen max-w-md translate-x-0 translate-y-0 rounded-none border-l border-slate-200 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Message Center</DialogTitle>
          <DialogDescription className="text-slate-500">
            Full announcement detail and attachments.
          </DialogDescription>
        </DialogHeader>
        {announcement ? (
          <div className="mt-6 space-y-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {announcement.date}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mt-2">{announcement.title}</h2>
              <p className="text-slate-600 mt-3 leading-relaxed">{announcement.body}</p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Attachments</div>
              <div className="mt-3 space-y-2">
                {announcement.attachments.map((file) => (
                  <button
                    key={file.name}
                    type="button"
                    className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-blue-300 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
                  >
                    <span className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400">{file.size}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 text-slate-500 text-sm">
            Select an announcement to view details.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
