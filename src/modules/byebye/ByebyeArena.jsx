import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Users,
  Palette,
  Calendar,
  Type,
  Bike,
  Smile,
  CheckCircle2,
  Settings,
  X,
  PartyPopper,
  Shuffle,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { playSound } from "../../lib/sound";
import { fireConfetti } from "../../lib/confetti";

const COLORS = [
  { name: "Rødt", hex: "#ef4444", bg: "bg-red-500", text: "text-red-500" },
  { name: "Blått", hex: "#3b82f6", bg: "bg-blue-500", text: "text-blue-500" },
  { name: "Grønt", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500" },
  { name: "Gult", hex: "#eab308", bg: "bg-yellow-400", text: "text-yellow-500" },
  { name: "Svart", hex: "#1f2937", bg: "bg-gray-800", text: "text-gray-800" },
  { name: "Hvitt", hex: "#f3f4f6", bg: "bg-slate-200", text: "text-slate-700" },
  { name: "Rosa", hex: "#ec4899", bg: "bg-pink-500", text: "text-pink-500" },
  { name: "Lilla", hex: "#a855f7", bg: "bg-purple-500", text: "text-purple-500" },
  { name: "Oransje", hex: "#f97316", bg: "bg-orange-500", text: "text-orange-500" },
  { name: "Grått", hex: "#6b7280", bg: "bg-gray-500", text: "text-gray-500" },
];

const MONTHS = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ".split("");

const TRAVEL_MODES = [
  "går hjem",
  "sykler eller sparker hjem",
  "tar buss hjem",
  "blir hentet med bil",
];

const CATEGORY_OPTIONS = [
  { id: "all", label: "Alt tilfeldig!", icon: Shuffle, color: "bg-indigo-500" },
  { id: "color", label: "Klesfarger", icon: Palette, color: "bg-pink-500", total: COLORS.length },
  { id: "birthday", label: "Bursdagsmåned", icon: Calendar, color: "bg-purple-500", total: MONTHS.length },
  { id: "letter", label: "Navnebokstav", icon: Type, color: "bg-blue-500", total: ALPHABET.length },
  { id: "travel", label: "Reisemåte", icon: Bike, color: "bg-emerald-500", total: TRAVEL_MODES.length },
  { id: "students", label: "Elevnavn", icon: Users, color: "bg-teal-500" },
  { id: "custom", label: "Egne regler", icon: Smile, color: "bg-orange-500" },
];

export default function ByebyeArena() {
  const activeClass = useAppStore(
    (s) => s.classes[s.activeClassId] ?? { name: "Min klasse", students: [] }
  );
  const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

  const customRules = useAppStore((s) => s.byebyeCustomRules);
  const addCustomRule = useAppStore((s) => s.addByebyeCustomRule);
  const removeCustomRule = useAppStore((s) => s.removeByebyeCustomRule);
  const resetCustomRules = useAppStore((s) => s.resetByebyeCustomRules);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [studentBatchSize, setStudentBatchSize] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayText, setDisplayText] = useState("Trykk 'Trekk' for å starte!");
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [drawnStudents, setDrawnStudents] = useState([]);
  const [drawnItems, setDrawnItems] = useState({
    colors: [],
    months: [],
    letters: [],
    travels: [],
    custom: [],
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newRuleInput, setNewRuleInput] = useState("");
  const animationRef = useRef(null);

  // Available students in active class that have not been drawn yet
  const remainingStudents = activeClass.students.filter(
    (name) => !drawnStudents.includes(name)
  );

  function generateRandomOption(cat, isFinal = false, currentDrawn = drawnItems) {
    let effectiveCat = cat;

    if (cat === "all") {
      const candidateSubCats = [];
      if (COLORS.some((c) => !currentDrawn.colors.includes(c.name))) candidateSubCats.push("color");
      if (MONTHS.some((m) => !currentDrawn.months.includes(m))) candidateSubCats.push("birthday");
      if (ALPHABET.some((l) => !currentDrawn.letters.includes(l))) candidateSubCats.push("letter");
      if (TRAVEL_MODES.some((t) => !currentDrawn.travels.includes(t))) candidateSubCats.push("travel");
      if (customRules.some((r) => !currentDrawn.custom.includes(r))) candidateSubCats.push("custom");
      if (remainingStudents.length > 0) candidateSubCats.push("students");

      if (candidateSubCats.length > 0) {
        effectiveCat = candidateSubCats[Math.floor(Math.random() * candidateSubCats.length)];
      } else {
        const subCats = ["color", "birthday", "letter", "travel", "custom"];
        if (remainingStudents.length > 0) subCats.push("students");
        effectiveCat = subCats[Math.floor(Math.random() * subCats.length)];
      }
    }

    if (effectiveCat === "color") {
      let available = COLORS.filter((c) => !currentDrawn.colors.includes(c.name));
      if (available.length === 0) available = COLORS;
      const col = isFinal
        ? available[Math.floor(Math.random() * available.length)]
        : COLORS[Math.floor(Math.random() * COLORS.length)];

      return {
        category: "Klesfarge",
        catKey: "colors",
        value: col.name,
        text: `De som har på seg noe ${col.name.toLowerCase()}!`,
        highlight: col.name,
        colorHex: col.hex,
      };
    } else if (effectiveCat === "birthday") {
      let available = MONTHS.filter((m) => !currentDrawn.months.includes(m));
      if (available.length === 0) available = MONTHS;
      const month = isFinal
        ? available[Math.floor(Math.random() * available.length)]
        : MONTHS[Math.floor(Math.random() * MONTHS.length)];

      return {
        category: "Bursdagsmåned",
        catKey: "months",
        value: month,
        text: `De som har bursdag i ${month}!`,
        highlight: month,
      };
    } else if (effectiveCat === "letter") {
      let available = ALPHABET.filter((l) => !currentDrawn.letters.includes(l));
      if (available.length === 0) available = ALPHABET;
      const letter = isFinal
        ? available[Math.floor(Math.random() * available.length)]
        : ALPHABET[Math.floor(Math.random() * ALPHABET.length)];

      return {
        category: "Første bokstav",
        catKey: "letters",
        value: letter,
        text: `De som har et fornavn som starter på bokstaven ${letter}!`,
        highlight: letter,
      };
    } else if (effectiveCat === "travel") {
      let available = TRAVEL_MODES.filter((t) => !currentDrawn.travels.includes(t));
      if (available.length === 0) available = TRAVEL_MODES;
      const travel = isFinal
        ? available[Math.floor(Math.random() * available.length)]
        : TRAVEL_MODES[Math.floor(Math.random() * TRAVEL_MODES.length)];

      return {
        category: "Reisemåte",
        catKey: "travels",
        value: travel,
        text: `De som ${travel}!`,
        highlight: travel,
      };
    } else if (effectiveCat === "students") {
      if (remainingStudents.length === 0) {
        return {
          category: "Elevnavn",
          text: "Alle elever i klasselisten har fått gå hjem! 🎉",
          isDone: true,
        };
      }
      const count = Math.min(studentBatchSize, remainingStudents.length);
      const shuffled = [...remainingStudents].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, count);

      const namesText =
        picked.length === 1
          ? picked[0]
          : picked.slice(0, -1).join(", ") + " og " + picked[picked.length - 1];

      return {
        category: "Elevnavn",
        text: `${namesText} kan gå hjem!`,
        highlight: namesText,
        pickedStudents: picked,
      };
    } else if (effectiveCat === "custom") {
      const rules =
        customRules.length > 0
          ? customRules
          : ["De som sitter helt stille med strake rygger!"];
      let available = rules.filter((r) => !currentDrawn.custom.includes(r));
      if (available.length === 0) available = rules;
      const rule = isFinal
        ? available[Math.floor(Math.random() * available.length)]
        : rules[Math.floor(Math.random() * rules.length)];

      return {
        category: "Egenskapt regel",
        catKey: "custom",
        value: rule,
        text: rule,
        highlight: rule,
      };
    }

    return {
      category: "Kriterium",
      text: "De som sitter helt stille med strake rygger!",
    };
  }

  function startSpin() {
    if (isSpinning) return;

    if (selectedCategory === "students" && remainingStudents.length === 0) {
      setDisplayText("Alle elever i klassen har dratt hjem! 🥳");
      return;
    }

    setIsSpinning(true);
    let counter = 0;
    const maxCycles = 22;
    const intervalTime = 80;

    const runCycle = () => {
      const tempOption = generateRandomOption(selectedCategory, false, drawnItems);
      setDisplayText(tempOption.text);
      playSound("tick", soundEnabled);

      counter++;
      if (counter < maxCycles) {
        animationRef.current = setTimeout(runCycle, intervalTime + counter * 6);
      } else {
        // Final pick strictly guaranteed non-repeating
        const finalOption = generateRandomOption(selectedCategory, true, drawnItems);
        setDisplayText(finalOption.text);
        setCurrentResult(finalOption);
        setIsSpinning(false);

        // Sound & Confetti
        playSound("tada", soundEnabled);
        fireConfetti();

        // Update history
        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            category: finalOption.category,
            text: finalOption.text,
          },
          ...prev,
        ]);

        // Mark drawn item/category value and reset list when full set is drawn
        if (finalOption.catKey && finalOption.value) {
          setDrawnItems((prev) => {
            const listKey = finalOption.catKey;
            const currentList = prev[listKey] || [];
            const nextList = [...currentList, finalOption.value];

            let totalItems = 0;
            if (listKey === "colors") totalItems = COLORS.length;
            else if (listKey === "months") totalItems = MONTHS.length;
            else if (listKey === "letters") totalItems = ALPHABET.length;
            else if (listKey === "travels") totalItems = TRAVEL_MODES.length;
            else if (listKey === "custom") totalItems = (customRules.length > 0 ? customRules.length : 1);

            if (nextList.length >= totalItems) {
              return {
                ...prev,
                [listKey]: [],
              };
            }

            return {
              ...prev,
              [listKey]: nextList,
            };
          });
        }

        // If student pick, mark them as drawn
        if (finalOption.pickedStudents) {
          setDrawnStudents((prev) => [...prev, ...finalOption.pickedStudents]);
        }
      }
    };

    runCycle();
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  function handleResetSession() {
    setHistory([]);
    setDrawnStudents([]);
    setDrawnItems({
      colors: [],
      months: [],
      letters: [],
      travels: [],
      custom: [],
    });
    setCurrentResult(null);
    setDisplayText("Start ny trekning!");
  }

  function handleAddRule(e) {
    e.preventDefault();
    if (!newRuleInput.trim()) return;
    addCustomRule(newRuleInput);
    setNewRuleInput("");
  }

  function getCategoryDrawnCount(catId) {
    if (catId === "color") return drawnItems.colors.length;
    if (catId === "birthday") return drawnItems.months.length;
    if (catId === "letter") return drawnItems.letters.length;
    if (catId === "travel") return drawnItems.travels.length;
    if (catId === "custom") return drawnItems.custom.length;
    if (catId === "students") return drawnStudents.length;
    return 0;
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4 md:p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink/10 bg-surface px-6 py-3.5 shadow-clay shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md">
            <PartyPopper size={24} />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink">Byebye!</h1>
            <p className="font-body text-sm text-ink/70">
              Rydd opp, still opp, og sjekk hvem som får gå hjem i dag!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-sm font-semibold text-ink shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Settings size={18} />
          Egne regler ({customRules.length})
        </button>
      </div>

      {/* Main 3-Column Layout: Left Category Panel (Ultra-compact / text wrap), Center Hero Card, Right Log & Class */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
        {/* LEFT SIDEBAR: Ultra-compact Vertical Category List (2 cols) */}
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-ink/10 bg-surface p-3 shadow-clay overflow-y-auto lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-ink/60">
              Kategori
            </h2>
            <span className="font-body text-[10px] text-ink/50">Duplikatfri</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {CATEGORY_OPTIONS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = getCategoryDrawnCount(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                      : "border-ink/10 bg-surface text-ink hover:border-primary/40 hover:bg-ink/5"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.color} text-white shadow-xs`}
                  >
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-bold leading-tight whitespace-normal break-words">
                      {cat.label}
                    </p>
                    {count > 0 && (
                      <p className="font-body text-xs font-semibold text-ink/60 leading-none mt-0.5">
                        {count} {cat.total ? `/ ${cat.total}` : ""}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCategory === "students" && (
            <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-2">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-teal-600 shrink-0" />
                <span className="font-heading text-xs font-semibold text-teal-900 leading-tight whitespace-normal break-words">
                  {activeClass.name} (Igjen: {remainingStudents.length})
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 pt-1">
                <span className="font-body text-[10px] font-medium text-teal-800">
                  Antall:
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStudentBatchSize(num)}
                      className={`h-6 w-6 cursor-pointer rounded-md border text-[11px] font-bold transition-all ${
                        studentBatchSize === num
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-teal-300 bg-white text-teal-800 hover:bg-teal-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER HERO DISPLAY CARD (6 cols) */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border-4 border-primary/40 bg-gradient-to-b from-primary/15 via-surface to-surface p-6 md:p-10 text-center shadow-clay lg:col-span-6 overflow-hidden">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-5 py-2 font-heading text-xs font-bold uppercase tracking-wider text-primary shadow-xs">
            <Sparkles size={16} />
            {currentResult?.category || "Klar for trekking"}
          </div>

          <div className="my-auto max-w-xl py-6">
            <p
              className={`font-heading text-3xl font-black transition-all md:text-5xl lg:text-6xl ${
                isSpinning
                  ? "scale-95 text-primary animate-pulse blur-[0.5px]"
                  : "scale-100 text-ink"
              }`}
            >
              {displayText}
            </p>
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={startSpin}
            className={`mt-auto flex cursor-pointer items-center gap-3.5 rounded-2xl border-b-4 border-primary-dark bg-primary px-10 py-5 font-heading text-2xl font-extrabold text-white shadow-xl transition-all hover:brightness-110 active:translate-y-1 active:border-b-0 ${
              isSpinning ? "cursor-not-allowed opacity-75" : ""
            }`}
          >
            <RefreshCw size={30} className={isSpinning ? "animate-spin" : ""} />
            {isSpinning ? "Trekker..." : "Trekk hvem som kan gå!"}
          </button>
        </div>

        {/* RIGHT SIDEBAR: History & Active Class (4 cols) */}
        <div className="flex flex-col gap-4 overflow-hidden lg:col-span-4">
          {/* History log */}
          <div className="flex flex-1 flex-col rounded-2xl border-2 border-ink/10 bg-surface p-4 shadow-clay overflow-hidden">
            <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-2">
              <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-ink/60">
                Trukket i dag ({history.length})
              </h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="flex cursor-pointer items-center gap-1 font-heading text-xs font-semibold text-red-500 hover:underline"
                >
                  <RefreshCw size={12} />
                  Nullstill
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-4 text-center text-ink/40">
                <PartyPopper size={32} className="mb-2 opacity-50" />
                <p className="font-body text-xs">
                  Ingen har fått gå hjem ennå.
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-surface-dark/40 p-3 shadow-xs"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-heading text-[11px] font-bold text-ink/50">
                        <span className="truncate">{item.category}</span>
                        <span>{item.time}</span>
                      </div>
                      <p className="font-body text-xs font-semibold text-ink leading-tight">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Class Student List */}
          {activeClass.students.length > 0 && (
            <div className="flex h-44 flex-col rounded-2xl border-2 border-ink/10 bg-surface p-4 shadow-clay overflow-hidden">
              <h2 className="mb-2 font-heading text-xs font-bold uppercase tracking-wider text-ink/60">
                Klasseliste ({activeClass.name})
              </h2>

              <div className="flex flex-wrap gap-1.5 overflow-y-auto pr-1">
                {activeClass.students.map((student) => {
                  const isGone = drawnStudents.includes(student);
                  return (
                    <span
                      key={student}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-heading text-xs font-semibold ${
                        isGone
                          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 line-through opacity-70"
                          : "border border-ink/10 bg-ink/5 text-ink"
                      }`}
                    >
                      {student}
                      {isGone && <CheckCircle2 size={12} />}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings / Custom Rules Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="flex w-full max-w-lg flex-col rounded-3xl border-2 border-ink/10 bg-surface p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-ink">
                Egne tilpassede regler
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="cursor-pointer rounded-full p-1 text-ink/50 hover:bg-ink/10 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="mb-4 flex gap-2">
              <input
                type="text"
                value={newRuleInput}
                onChange={(e) => setNewRuleInput(e.target.value)}
                placeholder="f.eks. 'De som har ryddet opp søppelet sitt!'"
                className="flex-1 rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-body text-sm text-ink outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="flex cursor-pointer items-center gap-1 rounded-xl border-2 border-primary bg-primary px-4 py-2 font-heading text-sm font-bold text-white shadow-sm hover:brightness-105"
              >
                <Plus size={18} />
                Legg til
              </button>
            </form>

            <div className="mb-4 flex max-h-[260px] flex-col gap-2 overflow-y-auto pr-1">
              {customRules.length === 0 ? (
                <p className="py-4 text-center font-body text-sm text-ink/50">
                  Ingen egne regler lagt til ennå.
                </p>
              ) : (
                customRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-ink/10 bg-surface-dark/50 p-3"
                  >
                    <span className="font-body text-sm font-medium text-ink">
                      {rule}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCustomRule(idx)}
                      className="cursor-pointer rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between border-t border-ink/10 pt-4">
              <button
                type="button"
                onClick={resetCustomRules}
                className="cursor-pointer font-heading text-xs font-semibold text-ink/60 hover:text-red-500 hover:underline"
              >
                Tilbakestill til standardregler
              </button>

              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="cursor-pointer rounded-xl border-2 border-ink/10 bg-surface px-4 py-2 font-heading text-sm font-bold text-ink hover:bg-ink/5"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
