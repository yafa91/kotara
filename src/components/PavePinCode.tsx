import './PavePinCode.css';

interface PavePinCodeProps {
  code: string;
  longueur?: number;
  onChangerCode: (code: string) => void;
  onValider: (codeComplet: string) => void;
}

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function PavePinCode({
  code,
  longueur = 4,
  onChangerCode,
  onValider,
}: PavePinCodeProps) {
  const appuyerChiffre = (chiffre: string) => {
    if (code.length >= longueur) return;
    const nouveauCode = code + chiffre;
    onChangerCode(nouveauCode);
    if (nouveauCode.length === longueur) {
      setTimeout(() => onValider(nouveauCode), 150);
    }
  };

  const effacer = () => onChangerCode(code.slice(0, -1));

  return (
    <div className="pave-pin">
      <div className="pave-pin-dots">
        {Array.from({ length: longueur }).map((_, i) => (
          <div key={i} className={`pave-pin-dot ${i < code.length ? 'pave-pin-dot-remplie' : ''}`} />
        ))}
      </div>

      <div className="pave-pin-clavier">
        {TOUCHES.map((chiffre) => (
          <button key={chiffre} className="pave-pin-touche" onClick={() => appuyerChiffre(chiffre)}>
            {chiffre}
          </button>
        ))}
        <div className="pave-pin-touche pave-pin-touche-vide" />
        <button className="pave-pin-touche" onClick={() => appuyerChiffre('0')}>
          0
        </button>
        <button className="pave-pin-touche pave-pin-touche-effacer" onClick={effacer}>
          ⌫
        </button>
      </div>
    </div>
  );
}
