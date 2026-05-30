"use client"

import { useState, useTransition } from "react"
import { Flag, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { finishRouteAction } from "@/features/driver-route/actions"

type FinishRouteButtonProps = {
  allStopsDone: boolean;
};

export function FinishRouteButton({ allStopsDone }: FinishRouteButtonProps) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [confirmUnfinished, setConfirmUnfinished] = useState(false)

  function handleFinish() {
    if (!allStopsDone && !confirmUnfinished) {
      return
    }

    startTransition(async () => {
      try {
        await finishRouteAction()
        toast.success("Route completed!")
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to finish route")
      }
    })
  }

  return (
    <>
      <Button
        variant={allStopsDone ? "default" : "outline"}
        className="w-full"
        onClick={() => {
          setConfirmUnfinished(false)
          setOpen(true)
        }}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Flag className="mr-2 size-4" />
        )}
        Finish Route
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Route</DialogTitle>
            <DialogDescription>
              {allStopsDone
                ? "All stops have been processed. Mark this route as complete?"
                : "You still have pending stops. Are you sure you want to finish without completing all stops?"}
            </DialogDescription>
          </DialogHeader>
          {!allStopsDone && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <input
                type="checkbox"
                id="confirm-unfinished"
                checked={confirmUnfinished}
                onChange={(e) => setConfirmUnfinished(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="confirm-unfinished">
                I confirm that remaining stops are not needed
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFinish}
              disabled={(!allStopsDone && !confirmUnfinished) || pending}
            >
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Finish Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
