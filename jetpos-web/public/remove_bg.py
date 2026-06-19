from PIL import Image
import sys
import glob
import os

def remove_checkers(img_path):
    try:
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            # item is (R, G, B, A)
            r, g, b, a = item
            
            # If the pixel is very light (close to white or light gray) and is neutral (R~=G~=B)
            if r > 215 and g > 215 and b > 215 and abs(r-g) < 15 and abs(g-b) < 15:
                # Make it completely transparent
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
                
        img.putdata(new_data)
        
        # Save over the original file
        img.save(img_path, "PNG")
        print(f"Successfully cleaned: {os.path.basename(img_path)}")
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

# Process all specific partner logos
logos = ["getir.png", "trendyol.png", "migros.png", "odeal_logo.png", "hugin.png", "yemeksepeti.png", "qnb.png", "fatura.png"]
for logo in logos:
    if os.path.exists(logo):
        remove_checkers(logo)

