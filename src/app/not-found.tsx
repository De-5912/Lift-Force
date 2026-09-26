import { Empty } from "@/components/ui";
export default function NotFound() {
  return (
    <Empty
      title="This page isn’t available"
      body="The requirement may have been removed, or you may not have access."
      href="/requirements"
      action="Browse requirements"
    />
  );
}
