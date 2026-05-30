import cv2
import numpy as np

def analyze():
    img = cv2.imread("d:\\projects\\SignBridge\\public\\SignBridgelogo.png", cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Could not load image")
        return
    
    alpha = img[:, :, 3]
    # Let's count non-zero alpha pixels per row
    row_counts = np.sum(alpha > 0, axis=1)
    col_counts = np.sum(alpha > 0, axis=0)
    
    print("Non-zero rows count:", np.sum(row_counts > 0))
    print("Non-zero cols count:", np.sum(col_counts > 0))
    
    # Print the indices of rows with non-zero alpha
    active_rows = np.where(row_counts > 0)[0]
    active_cols = np.where(col_counts > 0)[0]
    
    print("Active rows range:", active_rows[0], "to", active_rows[-1])
    print("Active cols range:", active_cols[0], "to", active_cols[-1])

    # Let's check if there are very few pixels at the extremes
    for idx in range(10):
        print(f"Row {active_rows[idx]}: {row_counts[active_rows[idx]]} pixels")
        print(f"Row {active_rows[-1-idx]}: {row_counts[active_rows[-1-idx]]} pixels")

if __name__ == "__main__":
    analyze()
