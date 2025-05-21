export default function WalletConnectInfo() {
  return (
    <div className="space-y-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground uppercase tracking-wider">
          Browser Extension
        </p>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Install one of these wallet extensions:
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://bittensor.com/wallet/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors font-medium"
            >
              Bittensor
            </a>
            <a
              href="https://polkadot.js.org/extension/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors font-medium"
            >
              Polkadot
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground uppercase tracking-wider">
          Mobile Wallet
        </p>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Or use Nova Wallet on your mobile device:
          </p>
          <a
            href="https://novawallet.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors font-medium"
          >
            Nova Wallet
          </a>
          <a
            href="https://docs.novawallet.io/nova-wallet-wiki/dapps/connect-to-dapps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80"
          >
            View connection guide
          </a>
        </div>
      </div>
    </div>
  );
}
