import cv2
import numpy as np

def crop_logo_smart():
    img_path = "d:\\projects\\SignBridge\\public\\SignBridgelogo.png"
    # Read original logo (D:\projects\SignBridge\SignBridgelogo.png is the original, let's load that one so we get fresh data)
    orig_path = "d:\\projects\\SignBridge\\SignBridgelogo.png"
    img = cv2.imread(orig_path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print("Error: Could not load original logo from SignBridge root.")
        # Try loading from public as fallback
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            print("Error: Could not load from public either.")
            return

    # Check alpha channel
    if img.shape[2] < 4:
        print("Image does not have alpha channel.")
        return
        
    alpha = img[:, :, 3]
    
    # Calculate non-zero pixel counts per row and column
    row_counts = np.sum(alpha > 0, axis=1)
    col_counts = np.sum(alpha > 0, axis=0)
    
    # Use a threshold to filter out noise pixels at the edges (e.g. at least 10 active pixels)
    threshold = 10
    active_rows = np.where(row_counts >= threshold)[0]
    active_cols = np.where(col_counts >= threshold)[0]
    
    if len(active_rows) == 0 or len(active_cols) == 0:
        print("Error: Under threshold, could not find active logo area.")
        return
        
    y1, y2 = active_rows[0], active_rows[-1]
    x1, x2 = active_cols[0], active_cols[-1]
    
    # Add a safe padding of 15px
    padding = 15
    h, w = img.shape[:2]
    y1 = max(0, y1 - padding)
    y2 = min(h, y2 + padding)
    x1 = max(0, x1 - padding)
    x2 = min(w, x2 + padding)
    
    cropped = img[y1:y2, x1:x2]
    
    # Save cropped image to public/SignBridgelogo.png
    cv2.imwrite(img_path, cropped)
    print(f"Successfully smart-cropped logo from {w}x{h} to {cropped.shape[1]}x{cropped.shape[0]}!")

if __name__ == "__main__":
    crop_logo_smart()
