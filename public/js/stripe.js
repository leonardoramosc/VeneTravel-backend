/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51Jgy0WGXSJsdABn1wutzwP1ASDN4se6ZkCoFmVrMrijO0OfebscXHch97LLHrpExejLsh1s1hF39bNcJWhg2xLLV00zIrRdsP6'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from server
    const session = await axios(
      `http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2) Create checkout form + charge credit card
    console.log(session.data.session.id);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });

  } catch (err) {
    showAlert('error', err.message);
  }
};
