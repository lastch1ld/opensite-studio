import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AcceptInviteButton } from "@/components/dashboard/AcceptInviteButton";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await auth();
  const invitation = await db.invitation.findUnique({ where: { token }, include: { site: true } });
  if (!invitation) notFound();

  if (invitation.acceptedAt) {
    return <p className="text-sm text-gray-500">This invitation has already been accepted.</p>;
  }

  if (invitation.email.toLowerCase() !== session!.user.email?.toLowerCase()) {
    return (
      <p className="text-sm text-red-600">
        This invitation was sent to {invitation.email}, which doesn&apos;t match your signed-in account.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Join {invitation.site.name}</h1>
      <p className="mt-2 text-sm text-gray-500">
        You&apos;ve been invited as {invitation.role.toLowerCase()}.
      </p>
      <AcceptInviteButton token={token} siteId={invitation.siteId} />
    </div>
  );
}
