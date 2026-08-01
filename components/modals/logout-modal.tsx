"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { authLogout } from "@/lib/api"

interface LogoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const handleLogout = async () => {
    try {
      await authLogout()
    } catch {
      // Ignore API failures and still sign out locally
    } finally {
      toast.success("Logged out successfully")
      onOpenChange(false)
      await signOut({ callbackUrl: "/auth/login" })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You will be redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout} className="bg-destructive">
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
