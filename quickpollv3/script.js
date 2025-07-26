function addOption() {
  const input = document.createElement("input");
  input.placeholder = "Another Option";
  input.classList.add("option");
  document.getElementById("options").appendChild(input);
}

async function createPoll() {
  const title = document.getElementById("pollTitle").value;
  const options = Array.from(document.querySelectorAll(".option")).map(i => i.value).filter(x => x.trim() !== "");
  const theme = document.getElementById("themeSelect").value;
  const multiple = document.getElementById("multipleChoice").checked ? "true" : "false";

  if (title.trim() === "" || options.length < 2) {
    alert("Please enter a title and at least two options.");
    return;
  }

  const res = await fetch("php/create_poll.php", {
    method: "POST",
    body: new URLSearchParams({
      title,
      options: JSON.stringify(options),
      theme,
      multiple
    })
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

    const isMultiple = !!j.multiple;
    j.options.forEach((opt, i) => {
      const label = document.createElement("label");
      const input = document.createElement(isMultiple ? "input" : "input");
      input.type = isMultiple ? "checkbox" : "radio";
      input.name = "vote";
      input.value = i;
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt));
      view.querySelector("#viewOptions").appendChild(label);
      view.querySelector("#viewOptions").appendChild(document.createElement("br"));
    });

    // Apply the theme from the poll data
    applyTheme(j.theme);
  }
};

async function submitVote() {
  const params = new URLSearchParams(location.search);
  const pollId = params.get("poll");
  const isMultiple = document.querySelector('input[type="checkbox"][name="vote"]');
  let selected;
  if (isMultiple) {
    selected = Array.from(document.querySelectorAll('input[name="vote"]:checked')).map(i => i.value);
    if (selected.length === 0) return alert("Select at least one option.");
  } else {
    selected = document.querySelector('input[name="vote"]:checked');
    if (!selected) return alert("Select an option.");
    selected = [selected.value];
  }

  if (localStorage.getItem("voted_" + pollId)) {
    alert("You already voted on this device.");
    return;
  }

  const res = await fetch("php/vote.php", {
    method: "POST",
    body: new URLSearchParams({ id: pollId, options: JSON.stringify(selected) })
  });

  const j = await res.json();
  if (j.status === "ok") {
    localStorage.setItem("voted_" + pollId, "1");
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

// Chart mode state
let creatorChartMode = "bar";
let resultChartMode = "bar";

let lastPieChart = null; // Add at the top of your script

// Pie chart renderer
function renderPieChart(containerId, options, votesContainerId, theme = "default") {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // Clear previous chart

  const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
  if (votesContainerId) {
    const votesEl = document.getElementById(votesContainerId);
    if (votesEl) votesEl.textContent = `Votes: ${totalVotes}`;
  }
  if (totalVotes === 0) {
    container.textContent = "No votes yet.";
    return;
  }

  // Create a div for AnyChart to use
  const chartDiv = document.createElement("div");
  chartDiv.style.width = "100%";
  chartDiv.style.height = "220px";
  const uniqueId = containerId + "-piechart";
  chartDiv.id = uniqueId;
  container.appendChild(chartDiv);

  // Prepare data for AnyChart
  const data = options.map(opt => [opt.name, opt.votes]);
  const colors = PIE_COLORS[theme] || PIE_COLORS["default"];

  // Draw the pie chart
  anychart.onDocumentReady(function () {
    let chart = anychart.pie(data);
    chart.palette(colors);
    chart.container(uniqueId);
    chart.draw();
    lastPieChart = chart; // Save reference
  });
}

// Modified chart renderer to support both modes
function renderChart(containerId, options, votesContainerId, mode, theme) {
  if (mode === "pie") {
    renderPieChart(containerId, options, votesContainerId, theme);
  } else {
    renderBarChart(containerId, options, votesContainerId);
  }
}

// Live update for creator chart
let creatorChartInterval;
async function showCreatorChart(pollId) {
  async function updateChart() {
    const res = await fetch("php/get_results.php?id=" + pollId);
    const j = await res.json();
    renderChart("creatorChart", j.options, "creatorVotes", creatorChartMode, j.theme || "default");
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
    renderChart("resultChart", j.options, "resultVotes", resultChartMode, j.theme || "default"); // Pass theme here
  }
  await updateChart();
  if (resultChartInterval) clearInterval(resultChartInterval);
  resultChartInterval = setInterval(updateChart, 2000);
}

// Add copy button and chart toggle functionality
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

  // Creator chart toggle
  const creatorToggleBtn = document.getElementById("creatorToggleChartBtn");
  if (creatorToggleBtn) {
    creatorToggleBtn.onclick = () => {
      creatorChartMode = creatorChartMode === "bar" ? "pie" : "bar";
      creatorToggleBtn.textContent = creatorChartMode === "bar" ? "Switch to Pie Chart" : "Switch to Bar Chart";
      // Re-render chart with new mode
      const pollId = document.getElementById("pollLink")?.value?.split("?poll=")[1];
      if (pollId) showCreatorChart(pollId);
    };
  }

  // Result chart toggle
  const resultToggleBtn = document.getElementById("resultToggleChartBtn");
  if (resultToggleBtn) {
    resultToggleBtn.onclick = () => {
      resultChartMode = resultChartMode === "bar" ? "pie" : "bar";
      resultToggleBtn.textContent = resultChartMode === "bar" ? "Switch to Pie Chart" : "Switch to Bar Chart";
      // Re-render chart with new mode
      const pollId = new URLSearchParams(location.search).get("poll");
      if (pollId) showResults();
    };
  }

  // Share Poll Button
  const shareBtn = document.getElementById("sharePollBtn");
  if (shareBtn) {
    shareBtn.onclick = () => {
      const link = document.getElementById("pollLink").value;
      if (navigator.share) {
        navigator.share({
          title: "QuickPoll",
          text: "Vote in my poll!",
          url: link
        });
      } else {
        // Fallback: show share options
        const subject = encodeURIComponent("Vote in my QuickPoll!");
        const body = encodeURIComponent("Check out this poll: " + link);
        window.open(
          `mailto:?subject=${subject}&body=${body}`,
          "_blank"
        );
      }
    };
  }

  // Theme picker
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      // Remove any previous theme class from <body>
      document.body.classList.remove("theme-green", "theme-orange", "theme-dark");
      if (this.value !== "default") {
        document.body.classList.add("theme-" + this.value);
      }
    });
  }

  // Export as CSV
  const exportCSVBtn = document.getElementById("exportCSVBtn");
  if (exportCSVBtn) {
    exportCSVBtn.onclick = async () => {
      const pollId = document.getElementById("pollLink")?.value?.split("?poll=")[1];
      if (!pollId) return;
      const res = await fetch("php/get_results.php?id=" + pollId);
      const j = await res.json();
      if (!j.options) return;
      let csv = "Option,Votes\n";
      j.options.forEach(opt => {
        csv += `"${opt.name || opt[0]}","${opt.votes != null ? opt.votes : opt[1]}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "poll-results.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  // Export chart as image
  const exportImageBtn = document.getElementById("exportImageBtn");
  if (exportImageBtn) {
    exportImageBtn.onclick = () => {
      alert("To export the chart as an image, right-click on the chart and choose 'Save image as...' or use your device's screenshot tool.");
    };
  }

  const editBtn = document.getElementById("editPollBtn");
  if (editBtn) {
    editBtn.onclick = async () => {
      const pollId = document.getElementById("pollLink")?.value?.split("?poll=")[1];
      if (!pollId) return;
      // Fetch poll results to check for votes
      const res = await fetch("php/get_results.php?id=" + pollId);
      const j = await res.json();
      const hasVotes = j.options.some(opt => opt.votes > 0);
      if (hasVotes) {
        alert("You can't edit the poll after votes have been cast.");
        return;
      }
      // Fill the createSection with current poll data
      document.getElementById("createSection").style.display = "block";
      document.getElementById("linkSection").style.display = "none";
      document.getElementById("pollTitle").value = j.title || "";
      // Remove old option inputs
      const optionsDiv = document.getElementById("options");
      optionsDiv.innerHTML = "";
      j.options.forEach(opt => {
        const input = document.createElement("input");
        input.className = "option";
        input.value = opt.name || opt[0] || "";
        optionsDiv.appendChild(input);
      });
      // Set theme and multiple choice
      document.getElementById("themeSelect").value = j.theme || "default";
      document.getElementById("multipleChoice").checked = !!j.multiple;
    };
  }
});

// After fetching poll data (e.g., in showPoll or similar function)
function applyTheme(theme) {
  document.body.classList.remove("theme-green", "theme-orange", "theme-dark");
  if (theme && theme !== "default") {
    document.body.classList.add("theme-" + theme);
  }
}

const PIE_COLORS = {
  default: ["#2575fc", "#6a11cb", "#4B9EFF", "#8e54e9", "#43e97b", "#38f9d7", "#ffb347", "#ff6961"],
  green:   ["#43e97b", "#38f9d7", "#a8e063", "#56ab2f", "#b7f8db", "#50c9c3", "#76b852", "#8fd3f4"],
  orange:  ["#ffb347", "#ffcc33", "#ff9966", "#ff5e62", "#f7971e", "#ffd452", "#f857a6", "#ff5858"],
  dark:    ["#888", "#aaa", "#444", "#222", "#555", "#999", "#333", "#bbb"]
};
