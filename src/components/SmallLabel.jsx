import React, { useEffect } from "react";

const SmallLabel = ({ data, autoPrint = true }) => {
    useEffect(() => {
        if (!autoPrint) return;
        const t = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(t);
    }, [autoPrint]);

    const printAreaStyle = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
    };

    const containerStyle = {
        width: "75mm",
        height: "35mm",
        border: "2px dashed #9ca3af",
        padding: "2mm",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fff",
        boxSizing: "border-box",
    };

    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 600,
        fontSize: "3mm",
        lineHeight: 1.2,
        color: "#000",
    };

    const pStyle = { 
        margin: 0,
        color: "#000",
    };

    const mattRowStyle = {
        display: "flex",
        justifyContent: "space-between",
        fontWeight: 600,
        fontSize: "3mm",
        marginTop: "1mm",
        lineHeight: 1.2,
    };

    const remarkStyle = {
        textAlign: "center",
        fontSize: "2.5mm",
        marginTop: "1mm",
        lineHeight: 1.2,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        color: "#000",
    };

    const logoWrapStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "1mm",
    };

    const logoImgStyle = {
        height: "15mm",
        width: "auto",
        objectFit: "contain",
    };

    return (
        <div id="print-area" style={printAreaStyle}>
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <p style={pStyle}>{data.subCategoryName}</p>
                    <p style={pStyle}>File no: {data.fileNo}</p>
                </div>

                <div style={mattRowStyle}>
                    <p style={pStyle}>Matt (%): {data.matt}</p>
                    <p style={pStyle}>Multi-Matt: +{data.additivePercentage}%</p>
                </div>

                {console.log("remark", data)}
                <div style={remarkStyle}>
                    {data.remark || "\u00A0"}
                </div>

                <div style={logoWrapStyle}>
                    <img
                        src={
                            data.brand === "mipa"
                                ? "/images/brand_logo/mipa.jpeg"
                                : "/images/brand_logo/rosner-logo.jpeg"
                        }
                        alt="brand logo"
                        style={logoImgStyle}
                    />
                </div>
            </div>
        </div>
    );
};

export default SmallLabel;
