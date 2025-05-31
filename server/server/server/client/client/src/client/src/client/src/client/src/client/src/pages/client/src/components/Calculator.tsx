import { useState } from "react";

interface CalculatorProps {
  onSecretAccess: (userId: number, pin: string) => void;
  onSetupNewPin?: () => void;
}

export function Calculator({ onSecretAccess, onSetupNewPin }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperator);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);

      // Check for secret PIN access
      const pin = display;
      if (pin === "1234" || pin === "7360" || pin === "4567") {
        setTimeout(() => {
          const userId = pin === "1234" ? 1 : pin === "7360" ? 2 : 3;
          onSecretAccess(userId, pin);
        }, 500);
      }
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <div className="mb-4">
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-right p-4 rounded text-2xl font-mono">
            {display}
          </div>
        </div>

        <div className="calculator-grid">
          <button onClick={clear} className="calculator-button clear-button col-span-2">
            Clear
          </button>
          <button onClick={() => inputOperator("÷")} className="calculator-button operator-button">
            ÷
          </button>
          <button onClick={() => inputOperator("×")} className="calculator-button operator-button">
            ×
          </button>

          <button onClick={() => inputNumber("7")} className="calculator-button number-button">
            7
          </button>
          <button onClick={() => inputNumber("8")} className="calculator-button number-button">
            8
          </button>
          <button onClick={() => inputNumber("9")} className="calculator-button number-button">
            9
          </button>
          <button onClick={() => inputOperator("-")} className="calculator-button operator-button">
            -
          </button>

          <button onClick={() => inputNumber("4")} className="calculator-button number-button">
            4
          </button>
          <button onClick={() => inputNumber("5")} className="calculator-button number-button">
            5
          </button>
          <button onClick={() => inputNumber("6")} className="calculator-button number-button">
            6
          </button>
          <button onClick={() => inputOperator("+")} className="calculator-button operator-button">
            +
          </button>

          <button onClick={() => inputNumber("1")} className="calculator-button number-button">
            1
          </button>
          <button onClick={() => inputNumber("2")} className="calculator-button number-button">
            2
          </button>
          <button onClick={() => inputNumber("3")} className="calculator-button number-button">
            3
          </button>
          <button onClick={performCalculation} className="calculator-button equals-button row-span-2">
            =
          </button>

          <button onClick={() => inputNumber("0")} className="calculator-button number-button col-span-2">
            0
          </button>
          <button onClick={() => inputNumber(".")} className="calculator-button number-button">
            .
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onSetupNewPin}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Setup New PIN
          </button>
        </div>
      </div>
    </div>
  );
}
