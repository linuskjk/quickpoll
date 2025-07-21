function addOption() {
  const input = document.createElement("input");
  input.placeholder = "Another Option";
  input.classList.add("option");
  document.getElementById("options").appendChild(input);
}

async function createPoll() {
  const title = document.getElementById("pollTitle").value;
  const options = Array.from(document.querySelectorAll(".option")).map(i => i.value).filter(x => x.trim() !== "");

  if (title.trim() === "" || options.length < 2) {
    alert("Please enter a title and at least two options.");
    return;
  }

  const res = await fetch("php/create_poll.php", {
    method: "POST",
    body: new URLSearchParams({ title, options: JSON.stringify(options) })
  });

  const j = await res.json();
  if (j.status === "ok") {
    document.getElementById("createSection").style.display = "none";
    document.getElementById("linkSection").style.display = "block";
    // FIX: Use location.origin + location.pathname for clean URL
    document.getElementById("pollLink").value = `${location.origin}${location.pathname}?poll=${j.id}`;
    showCreatorChart(j.id);
  } else {
    alert("Error creating poll.");
  }
}

window.onload = async () => {
  const params = new URLSearchParams(location.search);
  const pollId = params.get("poll");
  if (pollId) {
    const res = await fetch("php/get_poll.php?id=" + pollId);
    let j;
    try {
      j = await res.json();
    } catch (e) {
      alert("Poll not found or server error.");
      return;
    }
    if (j.status !== "ok") {
      alert("Poll not found.");
      return;
    }

    document.getElementById("createSection").style.display = "none";
    const view = document.getElementById("pollView");
    view.style.display = "block";
    document.getElementById("viewTitle").textContent = j.title;

    j.options.forEach((opt, i) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "vote";
      input.value = i;
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      view.querySelector("#viewOptions").appendChild(label);
      view.querySelector("#viewOptions").appendChild(document.createElement("br"));
    });
  }
};

async function submitVote() {
  const params = new URLSearchParams(location.search);
  const pollId = params.get("poll");
  const selected = document.querySelector('input[name="vote"]:checked');
  if (!selected) return alert("Select an option.");

  const res = await fetch("php/vote.php", {
    method: "POST",
    body: new URLSearchParams({ id: pollId, option: selected.value })
  });

  const j = await res.json();
  if (j.status === "ok") {
    showResults();
  } else {
    alert("You already voted or there was an error.");
  }
}

function renderBarChart(containerId, options, votesContainerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
  if (votesContainerId) {
    const votesEl = document.getElementById(votesContainerId);
    votesEl.textContent = `Votes: ${totalVotes}`;
  }
  const maxVotes = Math.max(...options.map(o => o.votes), 1); // avoid divide by zero
  options.forEach(opt => {
    const wrapper = document.createElement("div");
    wrapper.className = "bar-wrapper";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = (opt.votes / maxVotes * 100) + "%";
    bar.style.minWidth = "2%";
    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = `${opt.name} (${opt.votes})`;
    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

// Live update for creator chart
let creatorChartInterval;
async function showCreatorChart(pollId) {
  async function updateChart() {
    const res = await fetch("php/get_results.php?id=" + pollId);
    const j = await res.json();
    renderBarChart("creatorChart", j.options, "creatorVotes");
  }
  await updateChart();
  if (creatorChartInterval) clearInterval(creatorChartInterval);
  creatorChartInterval = setInterval(updateChart, 2000);
}

// Live update for results chart
let resultChartInterval;
async function showResults() {
  document.getElementById("pollView").style.display = "none";
  document.getElementById("resultsView").style.display = "block";
  const pollId = new URLSearchParams(location.search).get("poll");
  async function updateChart() {
    const res = await fetch("php/get_results.php?id=" + pollId);
    const j = await res.json();
    renderBarChart("resultChart", j.options, "resultVotes");
  }
  await updateChart();
  if (resultChartInterval) clearInterval(resultChartInterval);
  resultChartInterval = setInterval(updateChart, 2000);
}

// Add copy button functionality
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("copyLinkBtn");
  if (btn) {
    btn.onclick = () => {
      const link = document.getElementById("pollLink").value;
      navigator.clipboard.writeText(link);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy Link"), 1200);
    };
  }
});
