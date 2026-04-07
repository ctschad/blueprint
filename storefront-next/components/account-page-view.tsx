"use client";

import { FormEvent, useState } from "react";
import { useAccount } from "@/components/storefront-provider";

export function AccountPageView() {
  const { profile, signIn, signOut } = useAccount();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signIn(name, email);
  };

  if (profile.signedIn) {
    return (
      <section className="shell page-section">
        <p className="eyebrow">Account</p>
        <h1>Welcome back, {profile.name}.</h1>
        <div className="account-grid">
          <div className="surface-card">
            <h2>Profile</h2>
            <p>{profile.email}</p>
            <p>Your account details are saved on this device for a faster, more personalized session.</p>
          </div>
          <div className="surface-card">
            <h2>Subscriptions</h2>
            <p>Subscription management will appear here when you begin a recurring routine.</p>
          </div>
          <div className="surface-card">
            <h2>Orders</h2>
            <p>Recent orders will appear here once they have been placed.</p>
          </div>
        </div>
        <button type="button" className="button button--ghost" onClick={signOut}>
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section className="shell page-section">
      <p className="eyebrow">Account</p>
      <h1>Sign in</h1>
      <p>Enter your name and email to personalize your Blueprint account preview.</p>

      <form className="account-form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Blueprint Explorer" />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <button type="submit" className="button button--solid">
          Continue
        </button>
      </form>
    </section>
  );
}
