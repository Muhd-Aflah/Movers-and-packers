package com.swiftmove.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ReceiptPrinterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
