import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  console.log("🔔 Webhook received!");
  try {
    const evt = await verifyWebhook(req);
    const { id } = evt.data;
    const eventType = evt.type;
    console.log(
      `✅ Webhook verified - ID: ${id}, type: ${eventType}`
    );

    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      console.log(`👤 Creating user: ${id}, email: ${email_addresses[0].email_address}`);
      const user = await prisma.usuario.upsert({
        where: { clerkId: id },
        update: {},
        create: {
          clerkId: id,
          email: email_addresses[0].email_address,
          nombreCompleto: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
          nombreUsuario: username ?? email_addresses[0].email_address,
        },
      });
      console.log(`✅ User saved:`, user);
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}