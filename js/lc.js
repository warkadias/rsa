const API_BASE_URL = "https://api.gumroad.com/v2/licenses";
const PRODUCT_ID = "D-1vxIJJlbq1sZUhTpz70A==";

// Activate a license key
export const activateLicense = async (key) => {
	try {
		const response = await fetch(`${API_BASE_URL}/verify`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				product_id: PRODUCT_ID,
				license_key: key,
			}),
		});
		const data = await response.json();
		console.log("License activation response:", data);

		if (!data.success) {
			return {
				status: "failed",
				message: "License activation failed",
			};
		}

		return { status: "success", message: "License activated successfully", uses: data.uses };
	} catch (error) {
		console.log("Error activating license:", error);
		return { status: "error", message: "Error activating license" };
	}
};

export const checkLicense = async (key, uses) => {
	try {
		const response = await fetch(`${API_BASE_URL}/verify`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				product_id: PRODUCT_ID,
				license_key: key,
			}),
		});
		const data = await response.json();
		console.log("License check response:", data);

		if (!data.success) {
			return {
				status: "failed",
				message: "License check failed",
			};
		}

		if ((data.uses - uses) > 1) {
			return {
				status: "failed",
				message: "License check failed",
			};
		}

		return { status: "success", message: "License check successfully", uses: data.uses };
	} catch (error) {
		console.log("Error activating license:", error);
		return { status: "error", message: "Error activating license" };
	}
};