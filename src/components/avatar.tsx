import Image from "next/image";
import type { Profile } from "@/lib/domain";
export function Avatar({
  profile,
}: {
  profile: Pick<Profile, "name" | "photo_path">;
}) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return profile.photo_path && base ? (
    <Image
      alt={`${profile.name} profile`}
      width={55}
      height={55}
      unoptimized
      className="avatar"
      src={`${base}/storage/v1/object/public/profile-media/${profile.photo_path}`}
      style={{ objectFit: "cover" }}
    />
  ) : (
    <div className="avatar">
      {profile.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")}
    </div>
  );
}
