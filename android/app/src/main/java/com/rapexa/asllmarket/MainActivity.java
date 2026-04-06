package com.rapexa.asllmarket;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatButton;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Nullable
    private View loadingContainer;

    @Nullable
    private View errorContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        initBridgeOverlays();
        setupWebView();
    }

    private void initBridgeOverlays() {
        loadingContainer = findViewById(R.id.bridge_loading_container);
        if (loadingContainer != null) {
            loadingContainer.setVisibility(View.VISIBLE);
        }

        errorContainer = findViewById(R.id.bridge_error_container);

        AppCompatButton retry = findViewById(R.id.bridge_retry_button);
        if (retry != null) {
            retry.setOnClickListener(v -> {
                if (errorContainer != null) {
                    errorContainer.setVisibility(View.GONE);
                }
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().reload();
                }
            });
        }
    }

    private void setupWebView() {
        if (getBridge() == null) return;

        WebView webView = getBridge().getWebView();

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public void onPageFinished(WebView view, String url) {
                if (loadingContainer != null) {
                    loadingContainer.setVisibility(View.GONE);
                }
            }
        });
    }
}
