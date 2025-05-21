declare global {
  interface TradingViewWidgetOptions {
    autosize?: boolean;
    symbol?: string;
    interval?: string;
    timezone?: string;
    theme?: string;
    style?: string;
    locale?: string;
    toolbar_bg?: string;
    enable_publishing?: boolean;
    allow_symbol_change?: boolean;
    container_id?: string;
    studies?: string[];
    hide_side_toolbar?: boolean;
    details?: boolean;
    hotlist?: boolean;
    calendar?: boolean;
    show_popup_button?: boolean;
    popup_width?: string;
    popup_height?: string;
    [key: string]: any;
  }

  interface TradingViewStatic {
    widget: new (options: TradingViewWidgetOptions) => any;
  }

  interface Window {
    TradingView: TradingViewStatic;
  }
}
