import Swal from "sweetalert2";

export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: "#ffffff",
  color: "#333",
  customClass: {
    popup: "shadow-lg rounded-lg",
  },
});
