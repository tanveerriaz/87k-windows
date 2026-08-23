import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";
import { pathToFileURL } from "node:url";

type NetworkMap = NodeJS.Dict<NetworkInterfaceInfo[]>;

export type RoomUrls = {
  phone: string;
  wall: string;
  admin: string;
};

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

export function roomIpv4Addresses(interfaces: NetworkMap = networkInterfaces()): string[] {
  const addresses = Object.values(interfaces)
    .flatMap((entries) => entries ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal && isPrivateIpv4(entry.address))
    .map((entry) => entry.address);
  return [...new Set(addresses)];
}

export function buildRoomUrls(addresses: string[], port: number, roomCode: string, adminSecret?: string): RoomUrls[] {
  return addresses.map((address) => {
    const origin = `http://${address}:${port}`;
    const adminUrl = `${origin}/admin/${roomCode}`;
    return {
      phone: `${origin}/join/${roomCode}`,
      wall: `${origin}/wall/${roomCode}`,
      admin: adminSecret ? `${adminUrl}?key=${encodeURIComponent(adminSecret)}` : adminUrl,
    };
  });
}

function printRoomUrls(): void {
  const port = Number(process.argv[2] ?? "3000");
  const roomCode = process.argv[3] ?? "demo87";
  const configuredHost = process.argv[4]?.trim();
  const adminSecret = process.env.DEMO_ADMIN_SECRET?.trim() || undefined;
  const urls = buildRoomUrls(configuredHost ? [configuredHost] : roomIpv4Addresses(), port, roomCode, adminSecret);
  if (urls.length === 0) {
    console.error("No private room network was found. Connect the Mac and phones to the same Wi-Fi or hotspot, then retry.");
    process.exitCode = 1;
    return;
  }
  for (const room of urls) {
    console.log(`PHONE: ${room.phone}`);
    console.log(`WALL:  ${room.wall}`);
    console.log(`ADMIN: ${room.admin}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) printRoomUrls();
