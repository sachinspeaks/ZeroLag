import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type AudioDevice = {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind; // "audioinput" | "audiooutput" | "videoinput"
};

type DeviceSelections = {
  audioinput: string | null;
  audiooutput: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<string, string> = {
  audioinput: "Input",
  audiooutput: "Output",
};

// Groups the flat device list by kind
function groupByKind(devices: AudioDevice[]): Record<string, AudioDevice[]> {
  return devices.reduce<Record<string, AudioDevice[]>>((acc, device) => {
    if (!acc[device.kind]) acc[device.kind] = [];
    acc[device.kind].push(device);
    return acc;
  }, {});
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AudioDropDown() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selections, setSelections] = useState<DeviceSelections>({
    audioinput: null,
    audiooutput: null,
  });

  // Request mic permission so labels are populated, then enumerate
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then((allDevices) => {
        const audioDevices = allDevices
          .filter((d) => d.kind === "audioinput" || d.kind === "audiooutput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `${KIND_LABEL[d.kind]} device`,
            kind: d.kind,
          }));
        setDevices(audioDevices);
      })
      .catch(console.error);
  }, []);

  const select = (kind: keyof DeviceSelections, deviceId: string) =>
    setSelections((prev) => ({ ...prev, [kind]: deviceId }));

  const grouped = groupByKind(devices);
  const presentKinds = (["audioinput", "audiooutput"] as const).filter(
    (k) => grouped[k]?.length > 0,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded hover:bg-zinc-100 transition-colors duration-150 outline-none">
          <ChevronUp
            size={15}
            className="text-zinc-400 transition-transform duration-200 data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="
          bg-white border border-zinc-200 rounded-lg shadow-lg
          overflow-hidden py-1 z-50
          data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
          origin-top
        "
      >
        {presentKinds.map((kind, idx) => (
          <div key={kind}>
            <DropdownMenuLabel className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {KIND_LABEL[kind]}
            </DropdownMenuLabel>

            <DropdownMenuGroup>
              {grouped[kind].map((device) => {
                const isSelected = selections[kind] === device.deviceId;
                return (
                  <DropdownMenuItem
                    key={device.deviceId}
                    onSelect={() => select(kind, device.deviceId)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors duration-100 cursor-pointer rounded-none focus:rounded-none",
                      isSelected
                        ? "bg-indigo-50 text-indigo-700 font-medium focus:bg-indigo-50 focus:text-indigo-700"
                        : "text-zinc-700 hover:bg-zinc-50 focus:bg-zinc-50 focus:text-zinc-700",
                    )}
                  >
                    <span className="truncate">{device.label}</span>
                    {isSelected && (
                      <Check size={13} className="shrink-0 text-indigo-500" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            {idx < presentKinds.length - 1 && (
              <DropdownMenuSeparator className="bg-zinc-200 my-1" />
            )}
          </div>
        ))}

        {devices.length === 0 && (
          <DropdownMenuItem
            disabled
            className="px-3 py-2 text-sm text-zinc-400"
          >
            No audio devices found
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
