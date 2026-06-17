export default function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="ai-disclaimer">
      {text ??
        "AI-drafted by the Studio Engine — your editorial team makes every final decision."}
    </p>
  );
}
