import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
  
    }

    if (eventType === "organization.created") {
      const { id, name } = evt.data;
      console.log(`🏢 Creating organization: ${id}, name: ${name}`);
      const org = await prisma.organizacion.upsert({
        where: { clerkOrganizationId: id },
        update: {},
        create: {
          clerkOrganizationId: id,
          razonSocial: name,
          activa: true,
        },
      });
      console.log(`✅ Organization saved:`, org);
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    
    return new Response("Error verifying webhook", { status: 400 });
  }
}