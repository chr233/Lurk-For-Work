(() => {
  "use strict";

  let objs = {};
  let currentIndex = 0;

  // init
  window.SPA_INIT = (args) => {
    const jobList = document.getElementById("job-list");
    const btnBackTop = document.getElementById("back-top");
    const btnLoadMore = document.getElementById("load-more");

    btnLoadMore.addEventListener("click", () => loadJobList(currentIndex));
    document
      .getElementById("publish-new-job")
      .addEventListener("click", (event) => {
        location.hash = "#edit-job";
      });

    objs = {
      jobList,
      btnLoadMore,
    };

    if (!args || args < 0) {
      args = 0;
    }

    if (args === 0) {
      btnBackTop.style.display = "none";
    }
    btnBackTop.addEventListener("click", () => {
      location.hash = "#feed=0";
      location.reload();
    });

    currentIndex = args;
    loadJobList(args);

    // setup infinite scroll
    var io = new IntersectionObserver((ioes) => {
      for (let ioe of ioes) {
        if (ioe.intersectionRatio > 0) {
          loadJobList(currentIndex);
        }
        if (loadJobList.disabled) {
          io.unobserve(btnLoadMore);
        }
        console.log(ioe.intersectionRatio);
      }
    });
    io.observe(btnLoadMore);
  };

  // hash change
  window.WPA_CHANGE = (args) => {
    console.log("hash change event");
  };

  function loadJobList(start) {
    const { jobList, btnLoadMore } = objs;

    $api.getJobFeed(start).then(([succ, data]) => {
      if (!succ) {
        alert(data);
        return;
      }

      if (data && data.length > 0) {
        currentIndex += data.length;
        for (let x of data) {
          const li = $ele.genJobItem(x);
          jobList.appendChild(li);
        }
      } else {
        btnLoadMore.disabled = true;
        btnLoadMore.textContent = "Oppos, there is no more jobs";
      }
    });

    location.hash = `#feed=${currentIndex}`;
  }
})();
