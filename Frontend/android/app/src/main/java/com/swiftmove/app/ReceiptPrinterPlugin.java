package com.swiftmove.app;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintJob;
import android.print.PrintManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "ReceiptPrinter")
public class ReceiptPrinterPlugin extends Plugin {
    private final Handler printHandler = new Handler(Looper.getMainLooper());
    private final List<WebView> printWebViews = new ArrayList<>();
    private final Map<WebView, Runnable> printCleanupTasks = new HashMap<>();

    @PluginMethod
    public void printHtml(PluginCall call) {
        String html = call.getString("html");
        String name = call.getString("name", "SwiftMove Receipt");
        if (html == null || html.isBlank()) {
            call.reject("Receipt content is missing");
            return;
        }

        getActivity().runOnUiThread(() -> {
            final WebView receiptWebView;
            try {
                receiptWebView = new WebView(getActivity());
            } catch (Exception error) {
                call.reject("Could not open Android print options", error);
                return;
            }

            printWebViews.add(receiptWebView);
            final boolean[] submitted = {false};
            try {
                receiptWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (submitted[0]) return;
                        submitted[0] = true;
                        PrintManager printManager = (PrintManager) getContext()
                                .getSystemService(Context.PRINT_SERVICE);
                        if (printManager == null) {
                            releasePrintWebView(view);
                            call.reject("Android printing is unavailable");
                            return;
                        }

                        try {
                            PrintAttributes attributes = new PrintAttributes.Builder()
                                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                                    .setResolution(new PrintAttributes.Resolution(
                                            "swiftmove_receipt", "SwiftMove receipt", 300, 300))
                                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                    .build();
                            PrintJob printJob = printManager.print(name,
                                    view.createPrintDocumentAdapter(name), attributes);
                            watchPrintJob(printJob, view);
                            JSObject result = new JSObject();
                            result.put("opened", true);
                            call.resolve(result);
                        } catch (Exception error) {
                            releasePrintWebView(view);
                            call.reject("Could not open Android print options", error);
                        }
                    }
                });
                receiptWebView.loadDataWithBaseURL(
                        "https://swiftmove.local/", html, "text/html", "UTF-8", null);
            } catch (Exception error) {
                releasePrintWebView(receiptWebView);
                call.reject("Could not open Android print options", error);
            }
        });
    }

    private void watchPrintJob(PrintJob printJob, WebView webView) {
        long cleanupDeadline = SystemClock.uptimeMillis() + 15 * 60 * 1000L;
        Runnable[] monitor = new Runnable[1];
        monitor[0] = () -> {
            if (!printWebViews.contains(webView)) return;
            if (printJob.isCompleted() || printJob.isCancelled() || printJob.isFailed() ||
                    SystemClock.uptimeMillis() >= cleanupDeadline) {
                releasePrintWebView(webView);
            } else {
                printHandler.postDelayed(monitor[0], 1_000L);
            }
        };
        printCleanupTasks.put(webView, monitor[0]);
        printHandler.postDelayed(monitor[0], 1_000L);
    }

    private void releasePrintWebView(WebView webView) {
        Runnable cleanupTask = printCleanupTasks.remove(webView);
        if (cleanupTask != null) printHandler.removeCallbacks(cleanupTask);
        if (printWebViews.remove(webView)) {
            webView.stopLoading();
            webView.destroy();
        }
    }

    @Override
    protected void handleOnDestroy() {
        printHandler.removeCallbacksAndMessages(null);
        for (WebView webView : new ArrayList<>(printWebViews)) releasePrintWebView(webView);
        printWebViews.clear();
        printCleanupTasks.clear();
        super.handleOnDestroy();
    }
}
