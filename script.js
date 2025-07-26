// script.js (สำหรับ index.html)

document.addEventListener('DOMContentLoaded', () => {
    const productNameInput = document.getElementById('productName');
    const productQuantityInput = document.getElementById('productQuantity');
    const productUnitSelect = document.getElementById('productUnit');
    const addProductBtn = document.getElementById('addProductBtn');

    // ปุ่มลิงก์ไปหน้าต่างๆ
    const goToIncomingProductsPageBtn = document.getElementById('goToIncomingProductsPageBtn');
    const goToOutgoingProductsPageBtn = document.getElementById('goToOutgoingProductsPageBtn');
    const goToAllProductsPageBtn = document.getElementById('goToAllProductsPageBtn');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let editingIndex = -1; // -1 คือโหมดเพิ่มสินค้า, ค่าอื่นๆ คือ index ของสินค้าที่กำลังแก้ไข

    // *** โค้ดสำหรับโหลดข้อมูลสินค้าที่จะแก้ไข (สำคัญมาก) ***
    // ตรวจสอบว่ามีการส่ง timestamp ของสินค้าที่ต้องการแก้ไขมาหรือไม่
    const editProductTimestamp = sessionStorage.getItem('editProductTimestamp');
    if (editProductTimestamp) {
        const productToEditIndex = products.findIndex(p => p.timestamp === editProductTimestamp);
        if (productToEditIndex > -1) {
            editingIndex = productToEditIndex;
            const productToEdit = products[editingIndex];

            // เติมข้อมูลลงในฟอร์ม
            productNameInput.value = productToEdit.name;
            productQuantityInput.value = productToEdit.quantity;
            productUnitSelect.value = productToEdit.unit;

            // เปลี่ยนข้อความและสีปุ่ม
            addProductBtn.textContent = 'บันทึกการแก้ไข';
            addProductBtn.style.backgroundColor = '#28a745'; // สีเขียวเข้มขึ้น
            productNameInput.focus(); // โฟกัสไปที่ช่องชื่อสินค้า
        }
        sessionStorage.removeItem('editProductTimestamp'); // ลบออกหลังจากใช้งานแล้ว เพื่อไม่ให้แก้ไขซ้ำเมื่อโหลดหน้านี้อีก
    }
    // *** สิ้นสุดโค้ดโหลดข้อมูลสินค้าที่จะแก้ไข ***

    // Event Listener สำหรับปุ่มเปลี่ยนหน้า
    goToIncomingProductsPageBtn.addEventListener('click', () => {
        window.location.href = 'incoming_products.html';
    });
    goToOutgoingProductsPageBtn.addEventListener('click', () => {
        window.location.href = 'outgoing_products.html';
    });
    goToAllProductsPageBtn.addEventListener('click', () => {
        window.location.href = 'all_products.html';
    });

    // ฟังก์ชันสำหรับฟอร์แมตวันที่และเวลา (ยังคงเหมือนเดิม)
    function formatDateTime(dateString, type = 'added') {
        if (!dateString) return '';
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false, timeZone: 'Asia/Bangkok'
        };
        const date = new Date(dateString);
        let formattedDate = date.toLocaleDateString('th-TH', options);
        if (type === 'edited') {
            return `แก้ไขล่าสุด: ${formattedDate}`;
        } else if (type === 'outgoing') {
            return `ส่งออกเมื่อ: ${formattedDate}`;
        } else if (type === 'last_incoming') {
            return `นำเข้าล่าสุด: ${formattedDate}`;
        } else {
            return `เพิ่มเมื่อ: ${formattedDate}`;
        }
    }

    // ฟังก์ชันเพิ่ม/แก้ไขสินค้า
    addProductBtn.addEventListener('click', () => {
        const productName = productNameInput.value.trim();
        const productQuantity = parseInt(productQuantityInput.value.trim());
        const productUnit = productUnitSelect.value;
        const currentISOString = new Date().toISOString();

        if (productName && productQuantity > 0) {
            if (editingIndex === -1) { // โหมดเพิ่มสินค้าใหม่
                const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());

                if (existingProductIndex > -1) {
                    products[existingProductIndex].quantity += productQuantity;
                    products[existingProductIndex].lastEdited = currentISOString;
                    products[existingProductIndex].outgoingTimestamp = null; // ให้แน่ใจว่าสถานะกลับเป็นเข้า
                    // อัปเดต lastIncomingTimestamp เมื่อมีการเพิ่มจำนวน หรือกลับมาเป็นสินค้าเข้า
                    products[existingProductIndex].lastIncomingTimestamp = currentISOString;
                } else {
                    const newProduct = {
                        name: productName, quantity: productQuantity, unit: productUnit,
                        timestamp: currentISOString, // วันที่เพิ่มสินค้าครั้งแรก
                        lastEdited: null,
                        outgoingTimestamp: null,
                        lastIncomingTimestamp: currentISOString // วันที่นำเข้าล่าสุด (เมื่อเพิ่มครั้งแรก)
                    };
                    products.push(newProduct);
                }
            } else { // โหมดแก้ไขสินค้าที่มีอยู่
                products[editingIndex].name = productName;
                products[editingIndex].quantity = productQuantity;
                products[editingIndex].unit = productUnit;
                products[editingIndex].lastEdited = currentISOString;
                // ถ้าแก้ไขสินค้าที่ถูกส่งออกไปแล้ว และมีการเปลี่ยนปริมาณ/รายละเอียด
                // ถ้าไม่ได้เปลี่ยนสถานะ ให้ lastIncomingTimestamp คงเดิม
                // ถ้าเปลี่ยนกลับมาเป็นเข้า จะถูกจัดการโดยปุ่ม 'เข้า' ในหน้า all/incoming/outgoing
                if (!products[editingIndex].outgoingTimestamp && !products[editingIndex].lastIncomingTimestamp) {
                     products[editingIndex].lastIncomingTimestamp = currentISOString; // Ensure it's set if missing
                }


                editingIndex = -1; // รีเซ็ตเป็นโหมดเพิ่ม
                addProductBtn.textContent = 'เพิ่มสินค้า'; // เปลี่ยนข้อความปุ่ม
                addProductBtn.style.backgroundColor = '#4CAF50'; // เปลี่ยนสีปุ่มกลับ
            }

            saveProducts(); // บันทึกข้อมูลลง Local Storage

            // ล้างฟอร์ม
            productNameInput.value = '';
            productQuantityInput.value = '1';
            productUnitSelect.value = 'แกลอน';
            productNameInput.focus();
        } else {
            if (!productName) {
                productNameInput.style.borderColor = '#f44336';
                productNameInput.placeholder = 'กรุณากรอกชื่อสินค้า!';
            }
            if (productQuantity <= 0) {
                productQuantityInput.style.borderColor = '#f44336';
            }
            setTimeout(() => {
                productNameInput.style.borderColor = '#c8d6e5';
                productNameInput.placeholder = 'ชื่อสินค้า';
                productQuantityInput.style.borderColor = '#c8d6e5';
            }, 1500);
            productNameInput.focus();
        }
    });

    // ฟังก์ชันบันทึกสินค้าลง Local Storage
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }
});