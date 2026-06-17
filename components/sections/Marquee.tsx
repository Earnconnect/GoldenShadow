import { marqueeItems } from "@/lib/data";

export default function Marquee() {
  // Duplicate the track so the CSS scroll animation loops seamlessly.
  const loop = [...marqueeItems, ...marqueeItems];

  return (
    <div className="marquee">
      <div className="marquee-track">
        {loop.map((item, i) => (
          <span key={i}>
            <b>{item.lead}</b> · {item.tail}
          </span>
        ))}
      </div>
    </div>
  );
}
