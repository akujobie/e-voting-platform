
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Copy, RefreshCw, Lock, Unlock, Vote as VoteIcon, BarChart3, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "./index.css"; // Import your existing Bootstrap-based stylesheet

const DEFAULT_PARTIES = [
  { id: "candidate1", name: "ADC",logo: "/ADC logo.jpeg" },
  { id: "candidate2", name: "APC", logo: "/APC.jpg" },
  { id: "candidate3", name: "LP",  logo: "/LP%20logo.jpg" },
  { id: "candidate4", name: "NNPP",logo: "/nnpp.jpg" },
  { id: "candidate5", name: "PDP", logo: "/PDP.png" },
];

const LS_KEY = "evoting.portal.v1";

function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EVotingPortal({ parties = DEFAULT_PARTIES }) {
  const [store, setStore] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {
        votes: Object.fromEntries(parties.map(p => [p.id, 0])),
        voidVotes: 0,
        ended: false,
        usedCredentials: [],
      };
    } catch {
      return {
        votes: Object.fromEntries(parties.map(p => [p.id, 0])),
        voidVotes: 0,
        ended: false,
        usedCredentials: [],
      };
    }
  });

  const [currentCredential, setCurrentCredential] = useState(null);
  const [enteredNIN, setEnteredNIN] = useState("");
  const [enteredDOB, setEnteredDOB] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  }, [store]);

  const totalVotes = useMemo(() => {
    const partySum = Object.values(store.votes).reduce((a, b) => a + b, 0);
    return partySum + store.voidVotes;
  }, [store]);

  const chartData = useMemo(() => {
    return parties.map(p => ({ name: p.name, votes: store.votes[p.id] }))
      .concat([{ name: "Void", votes: store.voidVotes }]);
  }, [store, parties]);

  // Define valid credentials and used credentials arrays
  const validCredentials = [
    { username: '1234567890', passcode: '1990-01-01' },
    { username: '2345678901', passcode: '1991-02-02' },
    { username: '3456789012', passcode: '1992-03-03' },
    { username: '4567890123', passcode: '1993-04-04' },
    { username: '5678901234', passcode: '1994-05-05' },
    { username: '6789012345', passcode: '1995-06-06' },
    { username: '7890123456', passcode: '1996-07-07' },
    { username: '8901234567', passcode: '1997-08-08' },
    { username: '9012345678', passcode: '1998-09-09' },
    { username: '0123456789', passcode: '1999-10-10' },
  ];

  // Function to get user credentials
    function getCredentials() {
      const username = enteredNIN.trim();
      if (!username || !enteredDOB.trim()) {
        alert('Please enter both a National Identification Number and Date of birth!');
        return;
      }
      // Parse enteredDOB to Date and validate
      const dobDate = new Date(enteredDOB.trim());
      if (isNaN(dobDate.getTime())) {
        alert('Please enter a valid Date of birth!');
        return;
      }

      // Calculate age
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }

      if (age < 18) {
        alert('Sorry! You must be at least 18 years old to vote.');
        return;
      }

      const passcode = dobDate.toISOString().slice(0, 10);

    const credential = validCredentials.find(cred => cred.username === username && cred.passcode === passcode);
    console.log("Credential found:", credential);

    if (credential) {
      const credKey = `${username}:${passcode}`;
      if (store.usedCredentials.includes(credKey)) {
        alert('National Identification Number and Date of birth has been used, kindly enter another to vote.');
        return;
      }
      setStore(s => ({ ...s, usedCredentials: [...s.usedCredentials, credKey] }));
      setCurrentCredential({ username, passcode });
      setUnlocked(true);
      setShowResults(true); // Update the results after the user enters their credentials
    } else {
      alert('Invalid National Identification Number or Date of birth!');
      setUnlocked(false);
    }
  }

  function castVote(partyId) {
    if (store.ended || !unlocked) return;
    if (!store.votes.hasOwnProperty(partyId)) return;
    setStore(s => ({
      ...s,
      votes: { ...s.votes, [partyId]: s.votes[partyId] + 1 },
    }));
    setUnlocked(false);
    setCurrentCredential(null);
    setEnteredNIN("");
    setEnteredDOB("");
    setShowResults(true);
    alert("Your vote has been recorded.");
  }

  function castVoid() {
    if (store.ended || !unlocked) return;
    setStore(s => ({
      ...s,
      voidVotes: s.voidVotes + 1,
    }));
    setUnlocked(false);
    setCurrentCredential(null);
    setEnteredNIN("");
    setEnteredDOB("");
    setShowResults(true);
    alert("Void ballot recorded.");
  }

  function endVoting() {
    setStore(s => ({ ...s, ended: true }));
    setShowResults(true);
  }

  function reopenVoting() {
    setStore(s => ({ ...s, ended: false }));
  }

  function resetElection() {
    if (!confirm("This will erase all data. Continue?")) return;
    setStore({
      votes: Object.fromEntries(parties.map(p => [p.id, 0])),
      voidVotes: 0,
      ended: false,
      usedCredentials: [],
    });
    setCurrentCredential(null);
    setEnteredNIN("");
    setEnteredDOB("");
    setUnlocked(false);
    setShowResults(false);
  }

  function exportCSV() {
    const rows = [
      ["Candidate", "Votes"],
      ...parties.map(p => [p.name, store.votes[p.id]]),
      ["Void", store.voidVotes],
      ["Total", totalVotes],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    download(`election_tally_${new Date().toISOString().slice(0,10)}.csv`, csv);
  }

  return (
    <div className="container py-4">
      <motion.h1 className="text-center display-4 fw-bold mb-4 pt-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Electronic Voting Portal
      </motion.h1>

      <div className="mb-3 d-flex justify-content-evenly gap-2 flex-wrap">
        <button onClick={exportCSV} className="btn btn-outline-primary"><Download size={16}/> Export CSV</button>
        {!store.ended ? (
          <button onClick={endVoting} className="btn btn-danger"><Lock size={16}/> End Voting</button>
        ) : (
          <button onClick={reopenVoting} className="btn btn-success"><Unlock size={16}/> Re-open Voting</button>
        )}
        <button onClick={resetElection} className="btn btn-outline-dark"><RefreshCw size={16}/> Reset</button>
      </div>

      {currentCredential && (
        <div className="alert alert-info">
          <div>
            <div><strong>National Identification Number:</strong> {currentCredential.username}</div>
            <div><strong>Date of birth:</strong> {currentCredential.passcode}</div>
          </div>
        </div>
      )}

      <form className="row mb-4" onSubmit={e => { e.preventDefault(); getCredentials(); }}>
        <div className="col-md-4">
          <label htmlFor="ninInput" className="form-label">National Identification Number</label>
          <input
            id="ninInput"
            type="tel"
            maxLength={10}
            className="form-control"
            value={enteredNIN}
            onChange={e => {
              let value = e.target.value;
              console.log("NIN input changed:", value);
              // Remove non-digit characters
              value = value.replace(/\D/g, '');
              // Limit length to 10
              if (value.length <= 10) {
                setEnteredNIN(value);
              }
            }}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="dobInput" className="form-label">Date of birth</label>
          <input
            id="dobInput"
            type="date"
            className="form-control"
            value={enteredDOB}
            onChange={e => {
              console.log("DOB input changed:", e.target.value);
              setEnteredDOB(e.target.value);
            }}
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button type="submit" className="btn btn-success w-100"><Unlock size={16}/> {unlocked ? "Unlocked" : "Enter Credentials to Vote"}</button>
        </div>
      </form>

      {unlocked && <h5 className="mb-3 marquee">Click on your preferred party logo to vote</h5>}
      <div className="d-flex gap-3 flex-wrap mb-4">
        {parties.map(p => (
          <button key={p.id} onClick={() => castVote(p.id)} className="btn btn-light border p-2" disabled={store.ended || !unlocked}>
            <img src={p.logo} alt={p.name} style={{ width: "120px", height: "100px", objectFit: "contain" }}/>
            <div>{p.name}</div>
          </button>
        ))}
        <button onClick={castVoid} className="btn btn-secondary p-4" disabled={store.ended || !unlocked}><Trash2/> Void Vote</button>
    </div>
      {(showResults || store.ended || totalVotes > 0) && (
        <div className="card p-3">
          <h4 className="mb-3"><BarChart3/> Voting Results</h4>
          <div className="row text-center">
            <div className="col"><strong>Total</strong><div>{totalVotes}</div></div>
            {parties.map(p => (
              <div className="col" key={p.id}><strong>{p.name}</strong><div>{store.votes[p.id]}</div></div>
            ))}
            <div className="col"><strong>Void</strong><div>{store.voidVotes}</div></div>
          </div>
          <div style={{height:"300px"}} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="votes" fill="#198754" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
