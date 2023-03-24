(() => {
  "use strict";

  let objs = {};

  window.SPA_INIT = (args) => {
    const viewTitle = document.getElementById("view-title");
    const newJob = document.getElementById("new-job");
    const title = document.getElementById("title");
    const description = document.getElementById("description");
    const image = document.getElementById("image");
    const imageData = document.getElementById("image-data");
    const jobId = document.getElementById("job-id");
    const start = document.getElementById("start");
    const preview = document.getElementById("preview");
    const publishForm = document.getElementById("publish-job");
    const submitBtn = document.getElementById("submit-btn");

    if (window.jobInfo) {
      console.log(jobInfo);

      viewTitle.textContent = `Edit Job Id - ${jobInfo.id}`;
      submitBtn.textContent = "Edit Job";

      title.value = jobInfo.title;
      description.value = jobInfo.description;
      image.required = false;
      imageData.value = jobInfo.image;
      preview.src = jobInfo.image;
      start.value = jobInfo.start;
      jobId.value = jobInfo.id;

      publishForm.addEventListener("submit", editJob);
    } else {
      viewTitle.textContent = "New Job";
      submitBtn.textContent = "Publish Job";
      image.required = true;
      publishForm.addEventListener("submit", publishJob);
    }

    image.addEventListener("change", updatePreview);
    image.addEventListener("error", imageLoadError);

    objs = {
      newJob,
      title,
      description,
      image,
      imageData,
      start,
      preview,
      publishForm,
      jobId,
    };
  };

  window.SPA_CHANGE = (args) => {
    console.log("hash change event");
  };

  function imageLoadError(event) {
    const { preview } = objs;
    preview.src = "/assets/img/logo.webp";
  }

  function updatePreview(event) {
    const { image, imageData, preview } = objs;

    fileToDataUrl(image.files[0])
      .then((dataUrl) => {
        imageData.value = dataUrl;
        preview.src = dataUrl;
      })
      .catch((err) => {
        console.log(err);
        preview.src = "";
        image.value = null;
        imageData.value = null;
        alert("Image is not valid, only png, jpg and jpeg are allowed.");
      });
  }

  function publishJob(event) {
    event.preventDefault();

    const { title, description, imageData, start, publishForm, preview } = objs;

    if (!imageData.value) {
      alert("Please select a valid picture.");
    }

    $api
      .postJob(title.value, imageData.value, start.value, description.value)
      .then(([succ, data]) => {
        if (!succ) {
          alert(data);
          return;
        }

        alert("Job is created successfully!");
        publishForm.reset();
        preview.src = "";
      });
  }

  function editJob(event) {
    event.preventDefault();

    const { title, description, imageData, start, publishForm, jobId } = objs;

    if (!imageData.value) {
      alert("Please select a valid picture.");
    }

    $api
      .putJob(
        jobId.value,
        title.value,
        imageData.value,
        start.value,
        description.value
      )
      .then(([succ, data]) => {
        if (!succ) {
          alert(data);
          return;
        }

        alert("Job saved successfully!");

        window.jobInfo = null;
        location.hash = "#feed";
      });
  }
})();
