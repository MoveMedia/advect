using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace advect.io.Shared.Components;

public class CodeEditorModel
{
    public string Id { get; set; }
   public string Code { get; set; }
   public string Editable { get; set; }
    public string Language { get; set; }
    public bool AutoRun { get; set; }

    public string ClassName { get; set; }
}

