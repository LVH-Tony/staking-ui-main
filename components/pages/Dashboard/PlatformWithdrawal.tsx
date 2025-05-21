import { useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";

interface PlatformWithdrawalProps {
  totalStaked: number;
  onWithdraw: () => void;
  loading: boolean;
}

export function PlatformWithdrawal({
  totalStaked,
  onWithdraw,
  loading,
}: PlatformWithdrawalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleWithdraw = () => {
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    onWithdraw();
    setShowConfirmation(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-lg font-medium mb-3">Close proxy</h2>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Staked TAO</p>
            <p className="text-xl font-medium">{totalStaked.toFixed(2)} τ</p>
          </div>
          <LogOut className="w-5 h-5 text-gray-400" />
        </div>

        {showConfirmation ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm text-amber-800 font-medium">
                  Are you sure you want to close your proxy?
                </p>
                <p className="text-xs text-amber-700">
                  This action will unstake all your TAO from all subnets and
                  terminate the proxy relationship. The process may take some
                  time to complete.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? (
            "Processing Withdrawal..."
          ) : showConfirmation ? (
            "Confirm Close Proxy"
          ) : (
            <>
              Close Proxy
              <LogOut className="w-4 h-4" />
            </>
          )}
        </button>

        {showConfirmation && (
          <button
            onClick={() => setShowConfirmation(false)}
            className="w-full py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
