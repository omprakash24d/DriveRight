import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the callback data from PhonePe
    const body = await request.json();

    // For PhonePe callbacks, the actual verification should happen on the client side
    // or through a separate verification endpoint since this callback is primarily
    // for notification purposes

    // Respond with success to acknowledge receipt
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Callback processing failed'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle GET callback if needed
  const { searchParams } = new URL(request.url);

  // Redirect to the callback page for processing
  const merchantTransactionId = searchParams.get('merchantTransactionId');
  const transactionId = searchParams.get('transactionId');
  const code = searchParams.get('code');
  
  if (merchantTransactionId) {
    const callbackUrl = `/payment/phonepe/callback?merchantTransactionId=${merchantTransactionId}&transactionId=${transactionId || ''}&code=${code || ''}`;
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  // If no transaction ID, redirect to services page
  return NextResponse.redirect(new URL('/services', request.url));
}
