import { useState } from "react";

function ErrPage() {
  const colors = ["#fe7ff6", "#7ff6fe", "#f6fe7f", "#fe7f7f", "#7fff7f"];
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // States for hover colors
  const [hover4a, setHover4a] = useState(false);
  const [hover0, setHover0] = useState(false);
  const [hover4b, setHover4b] = useState(false);
  const [hoverErr, setHoverErr] = useState(false);
  const [hoverPage, setHoverPage] = useState(false);
  const [hoverNot, setHoverNot] = useState(false);
  const [hoverFound, setHoverFound] = useState(false);

  const [color4a, setColor4a] = useState("#fe7ff6");
  const [color0, setColor0] = useState("#fe7ff6");
  const [color4b, setColor4b] = useState("#fe7ff6");
  const [colorErr, setColorErr] = useState("#fe7ff6");
  const [colorPage, setColorPage] = useState("#fe7ff6");
  const [colorNot, setColorNot] = useState("#fe7ff6");
  const [colorFound, setColorFound] = useState("#fe7ff6");

  return (
    <div className="h-screen w-screen bg-black text-center text-white flex items-center justify-center font-mono font-bold flex-col">
      {/* Big 404 */}
      <h1 className="flex text-9xl gap-4">
        <span
          style={hover4a ? { textShadow: `4px 4px 0 ${color4a}` } : {}}
          onMouseEnter={() => {
            setColor4a(randomColor());
            setHover4a(true);
          }}
          onMouseLeave={() => setHover4a(false)}
          className="transition-all cursor-pointer"
        >
          4
        </span>
        <span
          style={hover0 ? { textShadow: `4px 4px 0 ${color0}` } : {}}
          onMouseEnter={() => {
            setColor0(randomColor());
            setHover0(true);
          }}
          onMouseLeave={() => setHover0(false)}
          className="transition-all cursor-pointer"
        >
          0
        </span>
        <span
          style={hover4b ? { textShadow: `4px 4px 0 ${color4b}` } : {}}
          onMouseEnter={() => {
            setColor4b(randomColor());
            setHover4b(true);
          }}
          onMouseLeave={() => setHover4b(false)}
          className="transition-all cursor-pointer"
        >
          4
        </span>
      </h1>

      {/* Subtitle */}
      <h1 className="text-4xl flex gap-4 justify-center flex-wrap">
        <span
          style={hoverErr ? { textShadow: `2.5px 2.5px 0 ${colorErr}` } : {}}
          onMouseEnter={() => {
            setColorErr(randomColor());
            setHoverErr(true);
          }}
          onMouseLeave={() => setHoverErr(false)}
          className="transition-all cursor-pointer"
        >
          ERROR
        </span>
        <span
          style={hoverPage ? { textShadow: `2.5px 2.5px 0 ${colorPage}` } : {}}
          onMouseEnter={() => {
            setColorPage(randomColor());
            setHoverPage(true);
          }}
          onMouseLeave={() => setHoverPage(false)}
          className="transition-all cursor-pointer"
        >
          PAGE
        </span>
        <span
          style={hoverNot ? { textShadow: `2.5px 2.5px 0 ${colorNot}` } : {}}
          onMouseEnter={() => {
            setColorNot(randomColor());
            setHoverNot(true);
          }}
          onMouseLeave={() => setHoverNot(false)}
          className="transition-all cursor-pointer"
        >
          NOT
        </span>
        <span
          style={hoverFound ? { textShadow: `2.5px 2.5px 0 ${colorFound}` } : {}}
          onMouseEnter={() => {
            setColorFound(randomColor());
            setHoverFound(true);
          }}
          onMouseLeave={() => setHoverFound(false)}
          className="transition-all cursor-pointer"
        >
          FOUND
        </span>
      </h1>

      {/* Button */}
      <div className="h-28 flex items-end">
      <button className="border border-white h-16 w-44 mt-20 text-xl transition-all cursor-pointer rounded-lg hover:shadow-[4px_4px_0px_#f6f6f6]">
        Exit
      </button>
      </div>
    </div>
  );
}

export default ErrPage;
