import { AnalyzerDropzone } from "./AnalyzerDropzone"

export function ComponentAnalyzerDropZone() {

    return (

        <>          
                <div className=" w-full flex flex-col mt-4 p-4">
                    <div className="w-full h-auto flex p-4 rounded-lg">
                        <AnalyzerDropzone/>
                    </div>
                </div>
        </>
    )

}
