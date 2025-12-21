'use client';

import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useState } from 'react';
import styles from './paypal-button.module.css';

interface PayPalButtonProps {
    amount: number;
    currency: string;
    onSuccess: (orderId: string, details: any) => void;
    onError: (error: any) => void;
    disabled?: boolean;
}

// PayPal buttons wrapper component
function PayPalButtonsWrapper({ amount, currency, onSuccess, onError, disabled }: PayPalButtonProps) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    const [processing, setProcessing] = useState(false);

    if (isPending) {
        return <div className={styles.loading}>Loading PayPal...</div>;
    }

    if (isRejected) {
        return <div className={styles.error}>Failed to load PayPal. Please refresh the page.</div>;
    }

    return (
        <div className={`${styles.paypalContainer} ${disabled ? styles.disabled : ''}`}>
            <PayPalButtons
                disabled={disabled || processing}
                forceReRender={[amount, currency]}
                style={{
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'paypal',
                    height: 48,
                }}
                createOrder={async () => {
                    try {
                        setProcessing(true);
                        const response = await fetch('/api/paypal/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount, currency }),
                        });
                        const data = await response.json();
                        if (data.success && data.data.orderId) {
                            return data.data.orderId;
                        }
                        throw new Error(data.error || 'Failed to create PayPal order');
                    } catch (error) {
                        console.error('PayPal create order error:', error);
                        setProcessing(false);
                        onError(error);
                        throw error;
                    }
                }}
                onApprove={async (data: any, actions: any) => {
                    try {
                        // The order has been approved by buyer
                        // We'll capture it in the parent component with order data
                        onSuccess(data.orderID, data);
                    } catch (error) {
                        console.error('PayPal approve error:', error);
                        onError(error);
                    } finally {
                        setProcessing(false);
                    }
                }}
                onCancel={() => {
                    setProcessing(false);
                    console.log('PayPal payment cancelled');
                }}
                onError={(error: any) => {
                    setProcessing(false);
                    console.error('PayPal error:', error);
                    onError(error);
                }}
            />
        </div>
    );
}

// Main PayPal button component with provider
export default function PayPalButton(props: PayPalButtonProps) {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
        return <div className={styles.error}>PayPal is not configured</div>;
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId,
                currency: props.currency || 'USD',
                intent: 'capture',
            }}
        >
            <PayPalButtonsWrapper {...props} />
        </PayPalScriptProvider>
    );
}
