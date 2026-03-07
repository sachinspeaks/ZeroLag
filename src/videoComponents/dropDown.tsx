import { useRef, useEffect } from "react";
import { Check, ChevronUp } from "lucide-react";

interface dropDownProps {
  options: MediaDeviceInfo[];
  open: boolean;
  selected: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  type: string;
}

export default function Dropdown({
  options,
  open,
  selected,
  setOpen,
  setSelected,
  type,
}: dropDownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  let dropDownEl: React.ReactNode | null;
  if (selected) {
    if (type === "video") {
      dropDownEl = options.map((option: MediaDeviceInfo) => {
        const isSelected = selected === option.deviceId;
        console.log(selected, "   curdeviceId ", option.deviceId);
        return (
          <li key={option.deviceId}>
            <button
              onClick={(e) => {
                setSelected(option.deviceId);
                setOpen(false);
                e.stopPropagation();
              }}
              className={`
                      w-full flex items-center justify-between
                      px-3 py-2 text-sm text-left transition-colors duration-100
                      ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }
                    `}
            >
              {option.label}
              {isSelected && <Check size={13} className="text-indigo-500" />}
            </button>
          </li>
        );
      });
    } else if (type === "audio") {
      const audioInputEl = [];
      const audioOutputEl = [];
      options.forEach((d) => {
        const isSelected = selected.split("-")[1] === d.deviceId;
        if (d.kind === "audioinput") {
          audioInputEl.push(
            <li key={`input-${d.deviceId}`}>
              <button
                onClick={(e) => {
                  setSelected(`input-${d.deviceId}`);
                  setOpen(false);
                  e.stopPropagation();
                }}
                className={`
                      w-full flex items-center justify-between
                      px-3 py-2 text-sm text-left transition-colors duration-100
                      ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }
                    `}
              >
                {d.label}
                {isSelected && <Check size={13} className="text-indigo-500" />}
              </button>
            </li>,
          );
        } else if (d.kind === "audiooutput") {
          audioOutputEl.push(
            <li key={`output-${d.deviceId}`}>
              <button
                onClick={(e) => {
                  setSelected(`output-${d.deviceId}`);
                  setOpen(false);
                  e.stopPropagation();
                }}
                className={`
                      w-full flex items-center justify-between
                      px-3 py-2 text-sm text-left transition-colors duration-100
                      ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }
                    `}
              >
                {d.label}
                {isSelected && <Check size={13} className="text-indigo-500" />}
              </button>
            </li>,
          );
        }
      });
      audioInputEl.unshift(
        <li
          key="input-label"
          className="px-3 pt-2 pb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide"
        >
          Microphone
        </li>,
      );
      audioOutputEl.unshift(
        <li
          key="output-label"
          className="px-3 pt-2 pb-1 text-xs font-semibold text-zinc-400 uppercase tracking-wide border-t border-zinc-100"
        >
          Speaker
        </li>,
      );
      dropDownEl = audioInputEl.concat(audioOutputEl);
    }
  }

  return (
    <div className="absolute right-0.5 top-1 z-100000 w-5 h-5 p-0 flex items-center justify-center">
      <div ref={ref} className="relative">
        {/* Caret-only trigger */}
        <button
          onClick={(e) => {
            setOpen((o: any) => !o);
            e.stopPropagation();
          }}
          className="p-1 rounded hover:bg-zinc-100 transition-colors duration-150 outline-none"
        >
          <ChevronUp
            size={15}
            className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Panel */}

        {dropDownEl && (
          <ul
            className={`
            absolute z-50 bg-white border border-zinc-200
            rounded-lg shadow-lg overflow-hidden py-1
            transition-all duration-150 origin-top bottom-full
            ${
              open
                ? "opacity-100 scale-y-100 pointer-events-auto"
                : "opacity-0 scale-y-95 pointer-events-none"
            }
          `}
          >
            {dropDownEl}
          </ul>
        )}
      </div>
    </div>
  );
}
