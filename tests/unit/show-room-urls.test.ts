import type { NetworkInterfaceInfo } from "node:os";
import { describe, expect, it } from "vitest";
import { buildRoomUrls, roomIpv4Addresses } from "../../scripts/show-room-urls";

const ipv4 = (address: string, internal = false): NetworkInterfaceInfo => ({
  address,
  netmask: "255.255.255.0",
  family: "IPv4",
  mac: "00:00:00:00:00:00",
  internal,
  cidr: `${address}/24`,
});

describe("room URL discovery", () => {
  it("keeps unique private IPv4 addresses and excludes unusable interfaces", () => {
    const addresses = roomIpv4Addresses({
      lo0: [ipv4("127.0.0.1", true)],
      en0: [ipv4("192.168.1.24")],
      bridge100: [ipv4("192.168.2.1"), ipv4("192.168.1.24")],
      public: [ipv4("203.0.113.8")],
      linkLocal: [ipv4("169.254.4.2")],
    });

    expect(addresses).toEqual(["192.168.1.24", "192.168.2.1"]);
  });

  it("builds phone, wall, and admin URLs for each room address", () => {
    expect(buildRoomUrls(["10.0.0.7"], 3000, "demo87")).toEqual([
      {
        phone: "http://10.0.0.7:3000/join/demo87",
        wall: "http://10.0.0.7:3000/wall/demo87",
        admin: "http://10.0.0.7:3000/admin/demo87",
      },
    ]);
  });

  it("appends the admin secret as a key query param when provided", () => {
    expect(buildRoomUrls(["10.0.0.7"], 3000, "demo87", "s3cret")).toEqual([
      {
        phone: "http://10.0.0.7:3000/join/demo87",
        wall: "http://10.0.0.7:3000/wall/demo87",
        admin: "http://10.0.0.7:3000/admin/demo87?key=s3cret",
      },
    ]);
  });
});
